import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommunityService } from './community.service';
import {
  PostResponseDto,
  CreatePostResponseDto,
} from './dto/post-response.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { PostStatus } from '../models/post.model';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  async createPost(
    @Req() req,
    @Body() createPostDto: CreatePostDto,
  ): Promise<CreatePostResponseDto> {
    // Extract user information from the JWT token
    const userId = req.user.userId || req.user.sub;
    const userName = req.user.fullName;
    const userAvatar = req.user.photo || '';

    return this.communityService.createPost(
      userId,
      userName,
      userAvatar,
      createPostDto,
    );
  }

  @Get('posts')
  async getAllPosts(
    @Query('status') status?: PostStatus,
  ): Promise<PostResponseDto[]> {
    return this.communityService.getAllPosts(status);
  }

  @Get('posts/:id')
  async getPostById(@Param('id') id: string): Promise<PostResponseDto> {
    const post = await this.communityService.getPostById(id);
    return post;
  }

  @Put('posts/:id/status')
  @UseGuards(JwtAuthGuard)
  async updatePostStatus(
    @Param('id') id: string,
    @Body('status') status: PostStatus,
  ) {
    const success = await this.communityService.updatePostStatus(id, status);
    return {
      success,
      message: success
        ? 'პოსტის სტატუსი წარმატებით განახლდა'
        : 'პოსტის სტატუსის განახლება ვერ მოხერხდა',
    };
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  async likePost(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    const success = await this.communityService.likePost(id, userId);
    return {
      success,
      message: success
        ? 'პოსტი წარმატებით მოიწონეთ'
        : 'პოსტის მოწონება ვერ მოხერხდა ან უკვე მოწონებულია',
    };
  }

  @Get('posts/:id/has-liked')
  @UseGuards(JwtAuthGuard)
  async hasLikedPost(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    const hasLiked = await this.communityService.hasUserLikedPost(id, userId);
    return {
      hasLiked,
    };
  }

  @Post('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('id') postId: string,
    @Req() req,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    const userId = req.user.userId || req.user.sub;
    const userName = req.user.fullName;
    const userAvatar = req.user.photo || '';

    return this.communityService.createComment(
      postId,
      userId,
      userName,
      userAvatar,
      createCommentDto,
    );
  }

  @Get('posts/:id/comments')
  async getCommentsByPostId(
    @Param('id') postId: string,
  ): Promise<CommentResponseDto[]> {
    return this.communityService.getCommentsByPostId(postId);
  }

  @Post('comments/:id/like')
  @UseGuards(JwtAuthGuard)
  async likeComment(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    const success = await this.communityService.likeComment(id, userId);
    return {
      success,
      message: success
        ? 'კომენტარი წარმატებით მოიწონეთ'
        : 'კომენტარის მოწონება ვერ მოხერხდა ან უკვე მოწონებულია',
    };
  }

  @Get('comments/:id/has-liked')
  @UseGuards(JwtAuthGuard)
  async hasLikedComment(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    const hasLiked = await this.communityService.hasUserLikedComment(
      id,
      userId,
    );
    return {
      hasLiked,
    };
  }

  @Post('posts/:id/unlike')
  @UseGuards(JwtAuthGuard)
  async unlikePost(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    const success = await this.communityService.unlikePost(id, userId);
    return {
      success,
      message: success
        ? 'პოსტის მოწონება წარმატებით გაუქმდა'
        : 'პოსტის მოწონების გაუქმება ვერ მოხერხდა',
    };
  }

  @Post('comments/:id/unlike')
  @UseGuards(JwtAuthGuard)
  async unlikeComment(@Param('id') id: string, @Req() req) {
    const userId = req.user.userId || req.user.sub;
    const success = await this.communityService.unlikeComment(id, userId);
    return {
      success,
      message: success
        ? 'კომენტარის მოწონება წარმატებით გაუქმდა'
        : 'კომენტარის მოწონების გაუქმება ვერ მოხერხდა',
    };
  }
}
