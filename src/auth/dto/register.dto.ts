import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class YearRange {
  @IsString()
  @Matches(/^\d{4}$/, { message: 'Year must be in YYYY format' })
  from: string;

  @IsString()
  @Matches(/^\d{4}$/, { message: 'Year must be in YYYY format' })
  to: string;
}

class CarModel {
  @IsString()
  modelId: string;

  @ValidateNested()
  @Type(() => YearRange)
  years: YearRange;
}

class Brand {
  @IsString()
  brandId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CarModel)
  models: CarModel[];
}

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @Matches(/^(\+995)?(5\d{8})$/, {
    message: 'Phone must be in format: +995XXXXXXXXX or XXXXXXXXX',
  })
  phone: string;

  @IsEnum(['user', 'dealer', 'mechanic', 'evacuator'])
  role: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Brand)
  brands?: Brand[];
}
