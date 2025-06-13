import {
  Controller,
  Post,
  Body,
  BadRequestException,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @Post('register/send-otp')
  async sendRegisterOtp(@Body() body: { phone: string; role: string }) {
    this.logger.log('Registration OTP request received');
    return this.authService.sendRegisterOtp(body.phone, body.role);
  }

  @Post('login/send-otp')
  async sendLoginOtp(@Body() body: { phone: string }) {
    this.logger.log('Login OTP request received');
    return this.authService.sendLoginOtp(body.phone);
  }

  @Post('register/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyRegisterOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    this.logger.log('Verify registration OTP request received');
    return this.authService.verifyRegisterOtp(verifyOtpDto);
  }

  @Post('login/verify-otp')
  @HttpCode(HttpStatus.OK)
  async verifyLoginOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    this.logger.log('Verify login OTP request received');
    return this.authService.verifyLoginOtp(verifyOtpDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    this.logger.log('Registration request received');

    if (!['user', 'mechanic', 'dealer'].includes(registerDto.role)) {
      this.logger.warn(`Invalid role provided: ${registerDto.role}`);
      throw new BadRequestException('Invalid role');
    }

    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    this.logger.log('Login request received');
    return this.authService.login(loginDto);
  }
}
