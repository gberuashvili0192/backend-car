import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BrandDocument = Brand & Document;

interface YearRange {
  from: string;
  to: string;
}

interface CarModel {
  id: string;
  name: string;
  years: YearRange;
}

@Schema()
export class Brand {
  @Prop({ required: true })
  name: string;

  @Prop({ type: Array })
  models: CarModel[];
}

export const BrandSchema = SchemaFactory.createForClass(Brand);
