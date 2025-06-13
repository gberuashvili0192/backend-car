import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { CarwashService } from './carwash.service';
import { CreateCarwashDto } from './dto/create-carwash.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('carwash')
export class CarwashController {
  private readonly logger = new Logger(CarwashController.name);

  constructor(private readonly carwashService: CarwashService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: any) {
    try {
      this.logger.log('Creating new carwash');
      const createCarwashDto: CreateCarwashDto =
        this.transformToDtoFormat(data);
      const result = await this.carwashService.create(createCarwashDto);
      return result;
    } catch (error) {
      this.logger.error(`Error creating carwash: ${error.message}`);
      throw new HttpException(
        'Error creating carwash',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  async findAll(@Query('city') city?: string) {
    try {
      this.logger.log(
        `Fetching all carwashes${city ? ` for city: ${city}` : ''}`,
      );
      if (city) {
        return await this.carwashService.findByCity(city);
      }
      return await this.carwashService.findAll();
    } catch (error) {
      this.logger.error(`Error fetching carwashes: ${error.message}`);
      throw new HttpException(
        'Error fetching carwashes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Fetching carwash with id: ${id}`);
      return await this.carwashService.findOne(id);
    } catch (error) {
      this.logger.error(`Error fetching carwash ${id}: ${error.message}`);
      throw new HttpException(
        'Error fetching carwash',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCarwashDto: Partial<CreateCarwashDto>,
  ) {
    try {
      this.logger.log(`Updating carwash with id: ${id}`);
      return await this.carwashService.update(id, updateCarwashDto);
    } catch (error) {
      this.logger.error(`Error updating carwash ${id}: ${error.message}`);
      throw new HttpException(
        'Error updating carwash',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    try {
      this.logger.log(`Removing carwash with id: ${id}`);
      await this.carwashService.remove(id);
      return { success: true, message: 'Carwash removed successfully' };
    } catch (error) {
      this.logger.error(`Error removing carwash ${id}: ${error.message}`);
      throw new HttpException(
        'Error removing carwash',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // სერვისების მართვის ენდფოინთები
  @Post(':id/services')
  @UseGuards(JwtAuthGuard)
  async addService(@Param('id') id: string, @Body() serviceData: any) {
    return this.carwashService.addService(id, serviceData);
  }

  @Put(':id/services/:serviceId')
  @UseGuards(JwtAuthGuard)
  async updateService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
    @Body() serviceData: any,
  ) {
    try {
      this.logger.log(`Updating service ${serviceId} for carwash ${id}`);
      return await this.carwashService.updateService(
        id,
        serviceId,
        serviceData,
      );
    } catch (error) {
      this.logger.error(`Error updating service: ${error.message}`);
      throw new HttpException(
        'Error updating service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id/services/:serviceId')
  @UseGuards(JwtAuthGuard)
  async removeService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    try {
      this.logger.log(`Removing service ${serviceId} from carwash ${id}`);
      return await this.carwashService.removeService(id, serviceId);
    } catch (error) {
      this.logger.error(`Error removing service: ${error.message}`);
      throw new HttpException(
        'Error removing service',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private transformToDtoFormat(data: any): CreateCarwashDto {
    if (data.basicInfo && data.location) {
      return data;
    }

    return {
      basicInfo: {
        name: data.name,
        description: data.description,
        phone: data.phone,
        email: data.email,
      },
      location: {
        address: data.address,
        city: data.city,
        coordinates: data.coordinates,
      },
      services: data.services,
      workingHours: data.workingHours,
    };
  }
}
