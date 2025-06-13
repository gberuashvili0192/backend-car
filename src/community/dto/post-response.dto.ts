import { PostCategory, PostStatus } from '../../models/post.model';

export class PostResponseDto {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  content: string;
  category: PostCategory;
  status: PostStatus;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  commentsCount: number;
  images: string[];
  tags: string[];
}

export class CreatePostResponseDto {
  success: boolean;
  message: string;
  data: PostResponseDto;
}
