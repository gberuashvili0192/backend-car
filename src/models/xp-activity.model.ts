import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.model';

export type XpActivityDocument = XpActivity & Document;

export enum ActivityType {
  CREATE_POST = 'CREATE_POST',
  LIKE_POST = 'LIKE_POST',
  RECEIVE_POST_LIKE = 'RECEIVE_POST_LIKE',
  CREATE_COMMENT = 'CREATE_COMMENT',
  RECEIVE_COMMENT_LIKE = 'RECEIVE_COMMENT_LIKE',
  DAILY_LOGIN = 'DAILY_LOGIN',
  WEEKLY_ACTIVE = 'WEEKLY_ACTIVE',
  COMPLETE_PROFILE = 'COMPLETE_PROFILE',
  USE_SERVICE = 'USE_SERVICE',
  REVIEW_SERVICE = 'REVIEW_SERVICE',
  INVITE_FRIEND = 'INVITE_FRIEND',
  REFERRED_SERVICE_USE = 'REFERRED_SERVICE_USE',
  XP_EXCHANGE = 'XP_EXCHANGE',
}

@Schema({ timestamps: true })
export class XpActivity {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: User;

  @Prop({
    type: String,
    enum: Object.values(ActivityType),
    required: true,
  })
  activity: string;

  @Prop({ required: true })
  xpAmount: number;

  @Prop({ type: String })
  sourceId: string;

  @Prop({ type: String })
  sourceType: string;
}

export const XpActivitySchema = SchemaFactory.createForClass(XpActivity);
