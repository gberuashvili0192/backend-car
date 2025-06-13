import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Message {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  isUser: boolean;

  @Prop({ required: true })
  timestamp: string;
}

@Schema({ timestamps: true })
export class Vehicle {
  @Prop({ required: true })
  brand: string;

  @Prop({ required: true })
  model: string;

  @Prop({ required: true })
  year: number;

  @Prop({ type: { from: Number, to: Number }, required: false })
  yearRange?: {
    from: number;
    to: number;
  };
}

@Schema({ timestamps: true })
export class Part {
  @Prop({ required: true })
  name: string;

  @Prop({ required: false, enum: ['new', 'used', 'refurbished'] })
  condition?: string;

  @Prop({
    type: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    required: true,
  })
  priceRange: {
    min: number;
    max: number;
  };
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: ['parts'] })
  type: string;

  @Prop({
    required: true,
    enum: ['pending', 'processing', 'completed'],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Vehicle, required: true })
  vehicle: Vehicle;

  @Prop({ type: Part, required: true })
  part: Part;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: [Message], default: [] })
  messages: Message[];
}

export type OrderDocument = Order & Document;
export const OrderSchema = SchemaFactory.createForClass(Order);
