import { Type } from 'class-transformer';
import {
  IsString,
  IsEmail,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsOptional,
} from 'class-validator';

export class BasicInfoDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  phone: string;

  @IsEmail()
  email: string;
}

export class CoordinatesDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

export class LocationDto {
  @IsString()
  address: string;

  @IsString()
  city: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;
}

export class ServiceDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsString()
  duration: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class WorkingHoursPeriodDto {
  @IsBoolean()
  isOpen: boolean;

  @IsString()
  @IsOptional()
  from?: string;

  @IsString()
  @IsOptional()
  to?: string;
}

export class WorkingHoursDto {
  @ValidateNested()
  @Type(() => WorkingHoursPeriodDto)
  monday: WorkingHoursPeriodDto;

  @ValidateNested()
  @Type(() => WorkingHoursPeriodDto)
  tuesday: WorkingHoursPeriodDto;

  @ValidateNested()
  @Type(() => WorkingHoursPeriodDto)
  wednesday: WorkingHoursPeriodDto;

  @ValidateNested()
  @Type(() => WorkingHoursPeriodDto)
  thursday: WorkingHoursPeriodDto;

  @ValidateNested()
  @Type(() => WorkingHoursPeriodDto)
  friday: WorkingHoursPeriodDto;

  @ValidateNested()
  @Type(() => WorkingHoursPeriodDto)
  saturday: WorkingHoursPeriodDto;

  @ValidateNested()
  @Type(() => WorkingHoursPeriodDto)
  sunday: WorkingHoursPeriodDto;
}

export class CreateCarwashDto {
  @ValidateNested()
  @Type(() => BasicInfoDto)
  basicInfo: BasicInfoDto;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceDto)
  services: ServiceDto[];

  @ValidateNested()
  @Type(() => WorkingHoursDto)
  workingHours: WorkingHoursDto;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
