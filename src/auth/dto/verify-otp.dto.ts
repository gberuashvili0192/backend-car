import { IsString, Matches } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @Matches(/^(\+995)?(5\d{8})$/, {
    message: 'Phone must be in format: +995XXXXXXXXX or XXXXXXXXX',
  })
  phone: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'OTP must be 4 digits' })
  otp: string;
}
