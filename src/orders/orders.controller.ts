import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto, req.user.userId);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('brand') brand?: string,
    @Query('condition') condition?: string,
    @Query('sort') sort?: string,
  ) {
    const filters = {
      status,
      type,
      'vehicle.brand': brand,
      'part.condition': condition,
    };

    return this.ordersService.findByUserId(req.user.userId, filters, sort);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateOrderDto: Partial<CreateOrderDto>,
  ) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Put(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.updateStatus(id, status);
  }

  @Post(':id/messages')
  async addMessage(
    @Param('id') id: string,
    @Body() message: any,
    @Request() req,
  ) {
    const messageWithMetadata = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      isUser: true,
    };
    return this.ordersService.addMessage(id, messageWithMetadata);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }
}
