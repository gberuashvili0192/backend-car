import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Logger,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    role: string;
  };
}

@Controller('bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  private readonly logger = new Logger(BookingsController.name);

  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @Req() req: RequestWithUser,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    this.logger.log(`Creating booking for user ${req.user.userId}`);
    this.logger.log(`Booking data: ${JSON.stringify(createBookingDto)}`);

    try {
      const booking = await this.bookingsService.create(
        req.user.userId,
        createBookingDto,
      );

      const response = {
        success: true,
        message: 'ჯავშანი წარმატებით შეიქმნა',
        data: {
          id: booking._id.toString(),
          carWashId: booking.carWashId,
          serviceId: booking.serviceId,
          date: booking.date,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          notes: booking.notes,
        },
      };

      this.logger.log(
        `Booking created successfully: ${JSON.stringify(response)}`,
      );
      return response;
    } catch (error) {
      this.logger.error(`Error creating booking: ${error.message}`);
      throw error;
    }
  }

  @Get()
  async findAll(@Req() req: RequestWithUser) {
    return this.bookingsService.findAll(req.user.userId);
  }

  @Get('upcoming-payments')
  async getUpcomingPayments(@Req() req: RequestWithUser) {
    try {
      const bookings = await this.bookingsService.getUpcomingPayments(req.user.userId);
      return {
        success: true,
        data: bookings,
      };
    } catch (error) {
      this.logger.error(`Error fetching upcoming payments: ${error.message}`);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string) {
    return this.bookingsService.cancel(id);
  }
}
