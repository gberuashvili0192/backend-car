import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class MessageDto {
  @IsString()
  id: string;

  @IsString()
  text: string;

  @IsBoolean()
  isUser: boolean;

  @IsString()
  timestamp: string;
}

export class YearRangeDto {
  @IsNumber()
  from: number;

  @IsNumber()
  to: number;
}

export class VehicleDto {
  @IsString()
  brand: string;

  @IsString()
  model: string;

  @IsNumber()
  year: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => YearRangeDto)
  yearRange?: YearRangeDto;
}

export class PriceRangeDto {
  @IsNumber()
  min: number;

  @IsNumber()
  max: number;
}

export class PartDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(['new', 'used', 'refurbished'])
  condition?: string;

  @ValidateNested()
  @Type(() => PriceRangeDto)
  priceRange: PriceRangeDto;
}

export class CreateOrderDto {
  @IsString()
  title: string;

  @IsEnum(['parts'])
  type: string;

  @IsEnum(['pending', 'processing', 'completed'])
  status: string;

  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle: VehicleDto;

  @ValidateNested()
  @Type(() => PartDto)
  part: PartDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  messages: MessageDto[];
}
