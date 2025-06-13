import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Post, PostSchema } from '../models/post.model';
import { Comment, CommentSchema } from '../models/comment.model';
import { Like, LikeSchema } from '../models/like.model';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { UploadService } from './upload.service';
import { AchievementsModule } from '../achievements/achievements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Like.name, schema: LikeSchema },
    ]),
    AchievementsModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService, UploadService],
  exports: [CommunityService, UploadService],
})
export class CommunityModule {}
