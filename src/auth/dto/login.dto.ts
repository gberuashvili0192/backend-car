import { IsString, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Matches(/^(\+995)?(5\d{8})$/, {
    message: 'Phone must be in format: +995XXXXXXXXX or XXXXXXXXX',
  })
  phone: string;

  @IsString()
  password: string;
}
