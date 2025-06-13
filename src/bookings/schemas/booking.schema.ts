import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Booking {
  @Prop({ type: String, required: true })
  carWashId: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: String, required: true })
  serviceId: string;

  @Prop({ type: String, required: true })
  date: string;

  @Prop({ type: String, required: true })
  startTime: string;

  @Prop({ type: String, required: true })
  endTime: string;

  @Prop({ type: String, default: 'pending' })
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, default: 'default' })
  vehicleId: string;

  @Prop({ type: Number, required: true })
  price: number;

  @Prop({ type: Number, required: true })
  serviceDuration: number;

  @Prop({ type: String })
  notes?: string;

  @Prop({ type: String, default: 'pending' })
  paymentStatus: 'pending' | 'completed' | 'failed';

  @Prop({ type: String })
  paymentMethod?: string;

  @Prop({ type: Date })
  paymentDate?: Date;
}

export type BookingDocument = Booking & Document;
export const BookingSchema = SchemaFactory.createForClass(Booking);
