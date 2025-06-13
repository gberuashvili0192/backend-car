import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.model';

export type RewardDocument = Reward & Document;

export enum RewardType {
  BADGE = 'BADGE',
  DISCOUNT = 'DISCOUNT',
  FREE_SERVICE = 'FREE_SERVICE',
  VIP_STATUS = 'VIP_STATUS',
}

@Schema({ timestamps: true })
export class Reward {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: User;

  @Prop({ required: true })
  achievementId: string;

  @Prop({
    type: String,
    enum: Object.values(RewardType),
    required: true,
  })
  type: string;

  @Prop({ type: String })
  code: string;

  @Prop({ type: Number })
  discountPercent: number;

  @Prop({ type: String })
  badge: string;

  @Prop({ type: String })
  name: string;

  @Prop({ type: Date })
  expiresAt: Date;

  @Prop({ type: Boolean, default: false })
  claimed: boolean;

  @Prop({ type: Date })
  claimedAt: Date;

  @Prop({ type: Boolean, default: false })
  used: boolean;

  @Prop({ type: Date })
  usedAt: Date;

  @Prop({ type: String })
  sourceType: string;
}

export const RewardSchema = SchemaFactory.createForClass(Reward);
