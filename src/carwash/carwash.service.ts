import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Carwash, CarwashDocument } from './schemas/carwash.schema';
import { CreateCarwashDto } from './dto/create-carwash.dto';

@Injectable()
export class CarwashService {
  private readonly logger = new Logger(CarwashService.name);

  constructor(
    @InjectModel(Carwash.name) private carwashModel: Model<CarwashDocument>,
  ) {}

  async create(createCarwashDto: CreateCarwashDto): Promise<Carwash> {
    this.logger.log('Creating new carwash');
    const createdCarwash = new this.carwashModel(createCarwashDto);
    const result = await createdCarwash.save();
    this.logger.log(`Carwash created with ID: ${result._id}`);
    return result;
  }

  async findAll(filters: any = {}): Promise<Carwash[]> {
    this.logger.log('Finding all carwashes with filters:', filters);
    try {
      const carwashes = await this.carwashModel
        .find({ isActive: true, ...filters })
        .exec();
      this.logger.log(`Found ${carwashes.length} carwashes`);
      return carwashes;
    } catch (error) {
      this.logger.error('Error finding carwashes:', error);
      throw error;
    }
  }

  async findOne(id: string): Promise<Carwash> {
    this.logger.log(`Finding carwash with ID: ${id}`);
    try {
      const carwash = await this.carwashModel
        .findOne({ _id: id, isActive: true })
        .exec();

      if (!carwash) {
        this.logger.warn(`Carwash with ID ${id} not found`);
        throw new NotFoundException(`Carwash with ID ${id} not found`);
      }

      this.logger.log(`Found carwash: ${carwash._id}`);
      return carwash;
    } catch (error) {
      this.logger.error(`Error finding carwash ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: string,
    updateCarwashDto: Partial<CreateCarwashDto>,
  ): Promise<Carwash> {
    this.logger.log(`Updating carwash with ID: ${id}`);
    try {
      const updatedCarwash = await this.carwashModel
        .findByIdAndUpdate(id, updateCarwashDto, { new: true })
        .exec();

      if (!updatedCarwash) {
        this.logger.warn(`Carwash with ID ${id} not found for update`);
        throw new NotFoundException(`Carwash with ID ${id} not found`);
      }

      this.logger.log(`Successfully updated carwash: ${updatedCarwash._id}`);
      return updatedCarwash;
    } catch (error) {
      this.logger.error(`Error updating carwash ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    this.logger.log(`Soft deleting carwash with ID: ${id}`);
    try {
      const result = await this.carwashModel
        .findByIdAndUpdate(id, { isActive: false }, { new: true })
        .exec();

      if (!result) {
        this.logger.warn(`Carwash with ID ${id} not found for deletion`);
        throw new NotFoundException(`Carwash with ID ${id} not found`);
      }

      this.logger.log(`Successfully soft deleted carwash: ${id}`);
    } catch (error) {
      this.logger.error(`Error soft deleting carwash ${id}:`, error);
      throw error;
    }
  }

  async findByCity(city: string): Promise<Carwash[]> {
    this.logger.log(`Finding carwashes in city: ${city}`);
    try {
      const carwashes = await this.carwashModel
        .find({ isActive: true, 'location.city': city })
        .exec();

      this.logger.log(`Found ${carwashes.length} carwashes in ${city}`);
      return carwashes;
    } catch (error) {
      this.logger.error(`Error finding carwashes in city ${city}:`, error);
      throw error;
    }
  }

  async updateService(
    id: string,
    serviceId: string,
    serviceData: any,
  ): Promise<Carwash> {
    const carwash = await this.carwashModel.findById(id).exec();
    if (!carwash) {
      throw new NotFoundException(`Carwash with ID ${id} not found`);
    }

    const serviceIndex = carwash.services.findIndex(
      (s) => s._id.toString() === serviceId,
    );
    if (serviceIndex === -1) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    carwash.services[serviceIndex] = {
      ...carwash.services[serviceIndex],
      ...serviceData,
    };
    return carwash.save();
  }

  async addService(id: string, serviceData: any): Promise<Carwash> {
    const carwash = await this.carwashModel.findById(id).exec();
    if (!carwash) {
      throw new NotFoundException(`Carwash with ID ${id} not found`);
    }

    carwash.services.push(serviceData);
    return carwash.save();
  }

  async removeService(id: string, serviceId: string): Promise<Carwash> {
    const carwash = await this.carwashModel.findById(id).exec();
    if (!carwash) {
      throw new NotFoundException(`Carwash with ID ${id} not found`);
    }

    carwash.services = carwash.services.filter(
      (s) => s._id.toString() !== serviceId,
    );
    return carwash.save();
  }
}
