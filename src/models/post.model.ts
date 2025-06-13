import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from './user.model';

export type PostDocument = Post & Document;

export enum PostCategory {
  QUESTION = 'question',
  REVIEW = 'review',
  NEWS = 'news',
  OTHER = 'other',
}

export enum PostStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ALL = 'all',
}

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({
    type: String,
    enum: Object.values(PostCategory),
    default: PostCategory.OTHER,
  })
  category: PostCategory;

  @Prop({
    type: String,
    enum: Object.values(PostStatus),
    default: PostStatus.PENDING,
  })
  status: PostStatus;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: User;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: 0 })
  commentsCount: number;

  // These fields are added by Mongoose's timestamps option
  createdAt: Date;
  updatedAt: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);
