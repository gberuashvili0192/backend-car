import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserXpDocument = UserXp & Document;

@Schema({ timestamps: true })
export class UserXp {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  xp: number;

  @Prop()
  lastDailyLoginDate: Date;

  @Prop()
  lastWeeklyRewardDate: Date;
}

export const UserXpSchema = SchemaFactory.createForClass(UserXp);
