import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ExchangeItemDocument = ExchangeItem & Document;

export enum ItemCategory {
  DISCOUNT = 'DISCOUNT',
  SERVICE = 'SERVICE',
  BADGE = 'BADGE',
  PREMIUM = 'PREMIUM',
}

@Schema({ timestamps: true })
export class ExchangeItem {
  @Prop({ required: true, unique: true })
  id: string;

  @Prop({ required: true, enum: ItemCategory })
  category: ItemCategory;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  xpCost: number;

  @Prop()
  icon: string;

  @Prop()
  color: string;

  @Prop({ default: true })
  active: boolean;
}

export const ExchangeItemSchema = SchemaFactory.createForClass(ExchangeItem);
