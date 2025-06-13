import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

interface YearRange {
  from: string;
  to: string;
}

interface CarModel {
  modelId: string;
  years: YearRange;
}

interface Brand {
  brandId: string;
  models: CarModel[];
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, unique: true })
  phone: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, enum: ['user', 'dealer', 'mechanic', 'evacuator'] })
  role: string;

  @Prop()
  category?: string;

  @Prop({ type: Array })
  brands: Brand[];

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
