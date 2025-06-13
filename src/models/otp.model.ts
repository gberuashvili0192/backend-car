import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema()
export class Otp {
  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ required: true, enum: ['user', 'mechanic', 'dealer'] })
  role: string;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);
