import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../models/user.model';
import { Otp, OtpDocument } from '../models/otp.model';
import { AUTH_ERRORS } from '../common/errors/auth.errors';
import { AchievementsService } from '../achievements/achievements.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private jwtService: JwtService,
    private readonly achievementsService: AchievementsService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto): Promise<any> {
    try {
      this.logger.log(`Attempting login for user: ${loginDto.phone}`);

      const user = await this.userModel.findOne({ phone: loginDto.phone });

      if (!user) {
        this.logger.warn(`Login failed: User not found - ${loginDto.phone}`);
        throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
      }

      if (!user.isVerified) {
        this.logger.warn(
          `Login failed: Please verify your phone number first - ${loginDto.phone}`,
        );
        throw new UnauthorizedException(AUTH_ERRORS.PHONE_NOT_VERIFIED);
      }

      const isValidPassword = await bcrypt.compare(
        loginDto.password,
        user.passwordHash,
      );

      if (!isValidPassword) {
        this.logger.warn(
          `Login failed: Invalid password for user - ${loginDto.phone}`,
        );
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_CREDENTIALS);
      }

      const token = this.generateToken(user);

      this.logger.log(`Login successful for user: ${loginDto.phone}`);

      // After successful login, award daily login XP
      try {
        await this.achievementsService.checkDailyLogin(user.id);
      } catch (error) {
        // Log but don't halt execution
        this.logger.error(`Error checking daily login: ${error.message}`);
      }

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          category: user.category,
          brands: user.brands,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        token,
      };
    } catch (error) {
      this.logger.error(`Login error for ${loginDto.phone}:`, error);
      throw error;
    }
  }

  async socialLogin(profile: any): Promise<any> {
    try {
      this.logger.log(
        `Social login attempt for: ${profile.email} via ${profile.provider}`,
      );

      // Find user by email
      let user = await this.userModel.findOne({ email: profile.email });

      // If user doesn't exist, create a new one
      if (!user) {
        this.logger.log(
          `Creating new user from ${profile.provider} profile: ${profile.email}`,
        );

        // Generate a random secure password for the user
        const randomPassword =
          Math.random().toString(36).slice(-12) +
          Math.random().toString(36).toUpperCase().slice(-4) +
          Math.random().toString(21).replace('.', '').slice(-4);

        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await this.userModel.create({
          email: profile.email,
          fullName: profile.fullName,
          password: hashedPassword,
          role: 'user', // Default role
          phone: '', // Empty phone number for social users
          socialProvider: profile.provider,
          socialProviderId: profile.id,
          photo: profile.photo,
        });
      }

      // Generate JWT token
      const token = this.jwtService.sign({
        sub: user._id,
        email: user.email,
        role: user.role,
      });

      this.logger.log(`Social login successful for: ${profile.email}`);

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role,
          photo: user.photo || profile.photo,
        },
        token,
      };
    } catch (error) {
      this.logger.error(`Social login error for ${profile.email}:`, error);
      throw error;
    }
  }

  async sendRegisterOtp(phone: string, role: string): Promise<any> {
    try {
      this.logger.log(
        `Sending registration OTP for phone: ${phone}, role: ${role}`,
      );

      const phoneRegex = /^(\+995)?(5\d{8})$/;
      if (!phoneRegex.test(phone)) {
        this.logger.warn(`Invalid phone format: ${phone}`);
        throw new BadRequestException(AUTH_ERRORS.INVALID_PHONE_FORMAT);
      }

      // Normalize phone number to remove +995 if present
      const normalizedPhone = phone.replace('+995', '');

      if (!['user', 'mechanic', 'dealer'].includes(role)) {
        this.logger.warn(`Invalid role provided: ${role}`);
        throw new BadRequestException(AUTH_ERRORS.INVALID_ROLE);
      }

      // Check if user already exists
      const existingUser = await this.userModel.findOne({
        phone: normalizedPhone,
      });
      if (existingUser) {
        throw new BadRequestException(AUTH_ERRORS.PHONE_ALREADY_EXISTS);
      }

      // Delete any existing OTP for this phone number
      await this.otpModel.deleteMany({ phone: normalizedPhone });

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

      // Save OTP with role
      await this.otpModel.create({
        phone: normalizedPhone,
        code: otp,
        role,
        expiresAt,
      });

      this.logger.log(
        `Registration OTP sent successfully to: ${normalizedPhone}`,
      );
      console.log(`Test OTP for ${normalizedPhone}: ${otp}`); // Development only

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300, // 5 minutes in seconds
      };
    } catch (error) {
      this.logger.error(`Send registration OTP error for ${phone}:`, error);
      throw error;
    }
  }

  async sendLoginOtp(phone: string): Promise<any> {
    try {
      this.logger.log(`Sending login OTP for phone: ${phone}`);

      const phoneRegex = /^(\+995)?(5\d{8})$/;
      if (!phoneRegex.test(phone)) {
        this.logger.warn(`Invalid phone format: ${phone}`);
        throw new BadRequestException(AUTH_ERRORS.INVALID_PHONE_FORMAT);
      }

      // Normalize phone number to remove +995 if present
      const normalizedPhone = phone.replace('+995', '');

      // Check if user exists
      const existingUser = await this.userModel.findOne({
        phone: normalizedPhone,
      });
      if (!existingUser) {
        throw new BadRequestException(AUTH_ERRORS.USER_NOT_FOUND);
      }

      // Delete any existing OTP for this phone number
      await this.otpModel.deleteMany({ phone: normalizedPhone });

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5); // 5 minutes expiry

      // Save OTP with user's role
      await this.otpModel.create({
        phone: normalizedPhone,
        code: otp,
        role: existingUser.role,
        expiresAt,
      });

      this.logger.log(`Login OTP sent successfully to: ${normalizedPhone}`);
      console.log(`Test OTP for ${normalizedPhone}: ${otp}`); // Development only

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresIn: 300, // 5 minutes in seconds
      };
    } catch (error) {
      this.logger.error(`Send login OTP error for ${phone}:`, error);
      throw error;
    }
  }

  async verifyRegisterOtp(verifyOtpDto: VerifyOtpDto): Promise<any> {
    try {
      const normalizedPhone = verifyOtpDto.phone.replace('+995', '');
      this.logger.log(
        `Verifying registration OTP for phone: ${normalizedPhone}`,
      );

      // Find the latest OTP for this phone number
      const otpRecord = await this.otpModel
        .findOne({
          phone: normalizedPhone,
          expiresAt: { $gt: new Date() }, // Check if not expired
        })
        .sort({ expiresAt: -1 }); // Get the latest one

      if (!otpRecord) {
        this.logger.warn(`No valid OTP found for phone: ${normalizedPhone}`);
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_OTP);
      }

      if (otpRecord.code !== verifyOtpDto.otp) {
        this.logger.warn(`Invalid OTP provided for phone: ${normalizedPhone}`);
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_OTP);
      }

      // OTP is valid - return success with role
      return {
        success: true,
        message: 'OTP verified successfully',
        role: otpRecord.role,
      };
    } catch (error) {
      this.logger.error(
        `Verify registration OTP error for ${verifyOtpDto.phone}:`,
        error,
      );
      throw error;
    }
  }

  async verifyLoginOtp(verifyOtpDto: VerifyOtpDto): Promise<any> {
    try {
      const normalizedPhone = verifyOtpDto.phone.replace('+995', '');
      this.logger.log(`Verifying login OTP for phone: ${normalizedPhone}`);

      // Find user
      const user = await this.userModel.findOne({
        phone: normalizedPhone,
      });

      if (!user) {
        this.logger.warn(`User not found: ${normalizedPhone}`);
        throw new UnauthorizedException(AUTH_ERRORS.USER_NOT_FOUND);
      }

      // Find the latest OTP for this phone number
      const otpRecord = await this.otpModel
        .findOne({
          phone: normalizedPhone,
          expiresAt: { $gt: new Date() }, // Check if not expired
        })
        .sort({ expiresAt: -1 }); // Get the latest one

      if (!otpRecord) {
        this.logger.warn(`No valid OTP found for phone: ${normalizedPhone}`);
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_OTP);
      }

      if (otpRecord.code !== verifyOtpDto.otp) {
        this.logger.warn(`Invalid OTP provided for phone: ${normalizedPhone}`);
        throw new UnauthorizedException(AUTH_ERRORS.INVALID_OTP);
      }

      // Generate token
      const token = this.generateToken(user);

      // Delete used OTP
      await this.otpModel.deleteMany({ phone: normalizedPhone });

      return {
        success: true,
        message: 'Login successful',
        user: {
          id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          category: user.category,
          brands: user.brands,
        },
        token,
      };
    } catch (error) {
      this.logger.error(
        `Verify login OTP error for ${verifyOtpDto.phone}:`,
        error,
      );
      throw error;
    }
  }

  async register(registerDto: RegisterDto): Promise<any> {
    try {
      const normalizedPhone = registerDto.phone.replace('+995', '');
      this.logger.log(`Attempting registration for user: ${normalizedPhone}`);

      // Find the latest verified OTP for this phone number
      const otpRecord = await this.otpModel
        .findOne({
          phone: normalizedPhone,
          expiresAt: { $gt: new Date() },
        })
        .sort({ expiresAt: -1 });

      if (!otpRecord) {
        this.logger.warn(`No verified OTP found for phone: ${normalizedPhone}`);
        throw new BadRequestException('Please verify your phone number first');
      }

      if (otpRecord.role !== registerDto.role) {
        this.logger.warn(`Role mismatch for phone: ${normalizedPhone}`);
        throw new BadRequestException('Role does not match the verified OTP');
      }

      // Check if user already exists
      const existingUser = await this.userModel.findOne({
        phone: normalizedPhone,
      });
      if (existingUser) {
        this.logger.warn(`User already exists: ${normalizedPhone}`);
        throw new BadRequestException(AUTH_ERRORS.PHONE_ALREADY_EXISTS);
      }

      // Generate a temporary password (in real implementation, user should set their password)
      const tempPassword = Math.random().toString(36).slice(-12);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = new this.userModel({
        ...registerDto,
        phone: normalizedPhone,
        passwordHash,
        isVerified: true, // User is verified since OTP was successful
      });

      await user.save();

      // Delete the used OTP
      await this.otpModel.deleteMany({ phone: normalizedPhone });

      const token = this.generateToken(user);

      return {
        success: true,
        message: 'Registration successful',
        user: {
          id: user._id,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          category: user.category,
          brands: user.brands,
        },
        token,
        tempPassword, // Send this only in development
      };
    } catch (error) {
      this.logger.error(`Registration error for ${registerDto.phone}:`, error);
      throw error;
    }
  }

  private generateToken(user: UserDocument) {
    const payload = {
      sub: user._id,
      phone: user.phone,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '7d',
    });
  }
}
