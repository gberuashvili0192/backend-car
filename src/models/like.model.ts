import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.model';

export type LikeDocument = Like & Document;

export enum LikeType {
  POST = 'post',
  COMMENT = 'comment',
}

@Schema({ timestamps: true })
export class Like {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  targetId: string;

  @Prop({ type: String, enum: Object.values(LikeType), required: true })
  type: LikeType;

  // Create a compound index on userId, targetId, and type to ensure uniqueness
  // This prevents a user from liking the same post/comment multiple times
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Add a compound index for uniqueness
LikeSchema.index({ userId: 1, targetId: 1, type: 1 }, { unique: true });
