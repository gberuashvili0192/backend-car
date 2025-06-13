import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    const createdOrder = new this.orderModel({
      ...createOrderDto,
      userId,
      createdAt: new Date().toISOString(),
    });
    return createdOrder.save();
  }

  async findAll(): Promise<Order[]> {
    return this.orderModel.find().exec();
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async findByUserId(
    userId: string,
    filters?: {
      status?: string;
      type?: string;
      'vehicle.brand'?: string;
      'part.condition'?: string;
    },
    sort: string = '-createdAt', // დეფოლტად ახლიდან ძველისკენ
  ): Promise<Order[]> {
    const query = { userId, ...filters };

    // წაშალე undefined ფილტრები
    Object.keys(query).forEach(
      (key) => query[key] === undefined && delete query[key],
    );

    return this.orderModel.find(query).sort(sort).exec();
  }

  async update(id: string, updateData: Partial<Order>): Promise<Order> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return updatedOrder;
  }

  async updateStatus(id: string, status: string): Promise<Order> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
    if (!updatedOrder) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return updatedOrder;
  }

  async addMessage(id: string, message: any): Promise<Order> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.messages.push(message);
    return order.save();
  }

  async delete(id: string): Promise<void> {
    const result = await this.orderModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
  }
}
