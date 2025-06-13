import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument } from './schemas/booking.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CarwashService } from '../carwash/carwash.service';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    private readonly carwashService: CarwashService,
  ) {}

  // სტატიკური სერვისების სია
  private readonly SERVICES = [
    {
      id: 'interior_clean',
      duration: '45',
      price: 50,
      name: 'სალონის წმენდა',
    },
    {
      id: 'exterior_wash',
      duration: '30',
      price: 30,
      name: 'გარე რეცხვა',
    },
    {
      id: 'chemical_clean',
      duration: '60',
      price: 70,
      name: 'ქიმწმენდა',
    },
  ];

  private findService(serviceId: string) {
    return this.SERVICES.find(
      (s) => s.id === serviceId || s.name === serviceId,
    );
  }

  async create(
    userId: string,
    createBookingDto: CreateBookingDto,
  ): Promise<BookingDocument> {
    try {
      this.logger.log(`Starting booking creation process...`);
      this.logger.log(
        `Received booking data: ${JSON.stringify(createBookingDto)}`,
      );

      const { carWashId, serviceId, date, time } = createBookingDto;

      // ვალიდაცია თარიღზე
      const bookingDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (bookingDate < today) {
        throw new BadRequestException('არ შეიძლება წარსული თარიღის არჩევა');
      }

      // შევამოწმოთ სამრეცხაო
      let carwash;
      try {
        carwash = await this.carwashService.findOne(carWashId);
        this.logger.log(`Found carwash: ${JSON.stringify(carwash)}`);
      } catch (error) {
        this.logger.error(`Error fetching carwash: ${error.message}`);
        throw new NotFoundException('სამრეცხაო ვერ მოიძებნა');
      }

      // შევამოწმოთ სერვისი
      this.logger.log(`Checking service: ${serviceId}`);
      const service = this.findService(serviceId);
      if (!service) {
        this.logger.error(`Service not found: ${serviceId}`);
        const availableServices = this.SERVICES.map((s) => s.name);
        throw new NotFoundException(
          `სერვისი "${serviceId}" ვერ მოიძებნა. ხელმისაწვდომი სერვისებია: ${availableServices.join(', ')}`,
        );
      }
      this.logger.log(`Service found: ${JSON.stringify(service)}`);

      // ვალიდაცია დროზე
      const [hours, minutes] = time.split(':').map(Number);
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        throw new BadRequestException(
          'არასწორი დროის ფორმატი. გამოიყენეთ HH:mm ფორმატი',
        );
      }

      // გამოვთვალოთ დასრულების დრო
      const duration = parseInt(service.duration);
      const endTime = this.calculateEndTime(time, 0, duration);
      this.logger.log(
        `Calculated end time: ${endTime} for duration: ${duration} minutes`,
      );

      // შევამოწმოთ ხელმისაწვდომობა
      const existingBookings = await this.bookingModel
        .find({
          carWashId,
          date,
          status: { $nin: ['cancelled'] },
          $or: [
            {
              startTime: { $lt: endTime },
              endTime: { $gt: time },
            },
          ],
        })
        .exec();

      if (existingBookings.length > 0) {
        throw new BadRequestException('მითითებული დრო დაკავებულია');
      }

      const booking = new this.bookingModel({
        carWashId,
        userId,
        serviceId: service.name,
        vehicleId: createBookingDto.vehicleId || 'default',
        date,
        startTime: time,
        endTime,
        status: 'pending',
        isActive: true,
        price: service.price,
        serviceDuration: duration,
        notes: createBookingDto.notes,
        paymentStatus: 'pending',
      });

      const savedBooking = await booking.save();
      this.logger.log(
        `Booking created successfully with ID: ${savedBooking._id}`,
      );

      return savedBooking;
    } catch (error) {
      this.logger.error(`Error in create booking: ${error.stack}`);
      throw error;
    }
  }

  async findAll(userId: string): Promise<any[]> {
    try {
      this.logger.log(`Fetching all bookings for user: ${userId}`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookings = await this.bookingModel
        .find({
          userId,
          isActive: true,
          date: { $gte: today.toISOString().split('T')[0] },
          status: { $ne: 'cancelled' },
        })
        .sort({ date: 1, startTime: 1 })
        .exec();

      // Get carwash details for each booking
      const bookingsWithCarwash = await Promise.all(
        bookings.map(async (booking) => {
          try {
            const carwash = await this.carwashService.findOne(
              booking.carWashId,
            );
            return {
              ...booking.toObject(),
              carWashName:
                carwash?.basicInfo?.name || 'სახელი არ არის მითითებული',
              carWashAddress:
                carwash?.location?.address || 'მისამართი არ არის მითითებული',
            };
          } catch (error) {
            this.logger.error(
              `Error fetching carwash details: ${error.message}`,
            );
            return {
              ...booking.toObject(),
              carWashName: 'სახელი არ არის მითითებული',
              carWashAddress: 'მისამართი არ არის მითითებული',
            };
          }
        }),
      );

      return bookingsWithCarwash;
    } catch (error) {
      this.logger.error(`Error fetching bookings: ${error.message}`);
      throw error;
    }
  }

  async findOne(id: string): Promise<Booking> {
    try {
      this.logger.log(`Fetching booking with ID: ${id}`);

      const booking = await this.bookingModel.findById(id).exec();
      if (!booking) {
        throw new NotFoundException('ჯავშანი ვერ მოიძებნა');
      }

      return booking;
    } catch (error) {
      this.logger.error(`Error fetching booking: ${error.message}`);
      throw error;
    }
  }

  async cancel(id: string): Promise<void> {
    try {
      this.logger.log(`Cancelling booking with ID: ${id}`);

      const booking = await this.bookingModel.findById(id).exec();
      if (!booking) {
        throw new NotFoundException('ჯავშანი ვერ მოიძებნა');
      }

      booking.status = 'cancelled';
      booking.isActive = false;
      await booking.save();

      this.logger.log(`Successfully cancelled booking: ${id}`);
    } catch (error) {
      this.logger.error(`Error cancelling booking: ${error.message}`);
      throw error;
    }
  }

  async getUpcomingPayments(userId: string): Promise<any[]> {
    try {
      this.logger.log(`Fetching upcoming payments for user: ${userId}`);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const bookings = await this.bookingModel
        .find({
          userId,
          isActive: true,
          date: { $gte: today.toISOString().split('T')[0] },
          status: { $ne: 'cancelled' },
          paymentStatus: 'pending',
        })
        .sort({ date: 1, startTime: 1 })
        .exec();

      // Get carwash details for each booking
      const bookingsWithCarwash = await Promise.all(
        bookings.map(async (booking) => {
          try {
            const carwash = await this.carwashService.findOne(
              booking.carWashId,
            );
            return {
              id: booking._id,
              carWashId: booking.carWashId,
              carWashName:
                carwash?.basicInfo?.name || 'სახელი არ არის მითითებული',
              carWashAddress:
                carwash?.location?.address || 'მისამართი არ არის მითითებული',
              serviceId: booking.serviceId,
              date: booking.date,
              startTime: booking.startTime,
              endTime: booking.endTime,
              price: booking.price,
              status: booking.status,
              paymentStatus: booking.paymentStatus,
            };
          } catch (error) {
            this.logger.error(
              `Error fetching carwash details: ${error.message}`,
            );
            return {
              id: booking._id,
              carWashId: booking.carWashId,
              carWashName: 'სახელი არ არის მითითებული',
              carWashAddress: 'მისამართი არ არის მითითებული',
              serviceId: booking.serviceId,
              date: booking.date,
              startTime: booking.startTime,
              endTime: booking.endTime,
              price: booking.price,
              status: booking.status,
              paymentStatus: booking.paymentStatus,
            };
          }
        }),
      );

      return bookingsWithCarwash;
    } catch (error) {
      this.logger.error(`Error fetching upcoming payments: ${error.message}`);
      throw error;
    }
  }

  private calculateEndTime(
    startTime: string,
    hours: number,
    minutes: number,
  ): string {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    let endHours = startHours + hours;
    let endMinutes = startMinutes + minutes;

    if (endMinutes >= 60) {
      endHours += Math.floor(endMinutes / 60);
      endMinutes = endMinutes % 60;
    }

    if (endHours >= 24) {
      endHours = endHours % 24;
    }

    return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
  }
}
