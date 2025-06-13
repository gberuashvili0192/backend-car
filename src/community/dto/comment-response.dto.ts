export class CommentResponseDto {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  postId: string;
  content: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}
