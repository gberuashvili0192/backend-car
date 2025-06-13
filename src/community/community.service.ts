import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument, PostStatus } from '../models/post.model';
import { Comment, CommentDocument } from '../models/comment.model';
import { Like, LikeDocument, LikeType } from '../models/like.model';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import {
  PostResponseDto,
  CreatePostResponseDto,
} from './dto/post-response.dto';
import { CommentResponseDto } from './dto/comment-response.dto';
import { UploadService } from './upload.service';
import { AchievementsService } from '../achievements/achievements.service';
import { ActivityType } from '../models/xp-activity.model';
import { XP_ACTIVITIES } from 'src/constants/achievement-constants';

@Injectable()
export class CommunityService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Like.name) private likeModel: Model<LikeDocument>,
    private readonly uploadService: UploadService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async createPost(
    userId: string,
    userName: string,
    userAvatar: string,
    createPostDto: CreatePostDto,
  ): Promise<CreatePostResponseDto> {
    // If no images provided, use default images
    let images = createPostDto.images || [];
    if (!images.length) {
      // Use one default image
      images = [this.uploadService.getDefaultImage()];
    }

    // Create post with pending status
    const newPost = new this.postModel({
      ...createPostDto,
      userId: new Types.ObjectId(userId),
      status: PostStatus.PENDING,
      images,
    });

    const savedPost = await newPost.save();

    // Add XP for creating a post
    try {
      await this.achievementsService.addXp(
        userId,
        XP_ACTIVITIES[ActivityType.CREATE_POST].xp,
        ActivityType.CREATE_POST,
        savedPost._id.toString(),
        'Post',
      );
    } catch (error) {
      // Log but don't halt execution
      console.error('Error awarding XP for post creation:', error);
    }

    // Create response
    const response: CreatePostResponseDto = {
      success: true,
      message: 'პოსტი წარმატებით შეიქმნა და გადავიდა მოდერაციაზე',
      data: {
        id: savedPost._id.toString(),
        userId,
        userName,
        userAvatar,
        title: savedPost.title,
        content: savedPost.content,
        category: savedPost.category,
        status: savedPost.status,
        createdAt: savedPost.createdAt,
        updatedAt: savedPost.updatedAt,
        likes: savedPost.likes,
        commentsCount: savedPost.commentsCount,
        images: savedPost.images || [],
        tags: savedPost.tags || [],
      },
    };

    return response;
  }

  async getAllPosts(status?: PostStatus): Promise<PostResponseDto[]> {
    // If status is "ALL" or not provided, get all posts
    const query = status && status !== PostStatus.ALL ? { status } : {};

    const posts = await this.postModel
      .find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'fullName photo',
      })
      .exec();

    return posts.map((post) => {
      const user = post.userId as any;
      return {
        id: post._id.toString(),
        userId: user ? user._id.toString() : '',
        userName: user ? user.fullName : '',
        userAvatar: user ? user.photo || '' : '',
        title: post.title,
        content: post.content,
        category: post.category,
        status: post.status,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        likes: post.likes,
        commentsCount: post.commentsCount,
        images: post.images,
        tags: post.tags,
      };
    });
  }

  async getPostById(postId: string): Promise<PostResponseDto | null> {
    const post = await this.postModel
      .findById(postId)
      .populate({
        path: 'userId',
        select: 'fullName photo',
      })
      .exec();

    if (!post) {
      return null;
    }

    const user = post.userId as any;
    return {
      id: post._id.toString(),
      userId: user ? user._id.toString() : '',
      userName: user ? user.fullName : '',
      userAvatar: user ? user.photo || '' : '',
      title: post.title,
      content: post.content,
      category: post.category,
      status: post.status,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      likes: post.likes,
      commentsCount: post.commentsCount,
      images: post.images,
      tags: post.tags,
    };
  }

  async updatePostStatus(postId: string, status: PostStatus): Promise<boolean> {
    const result = await this.postModel
      .updateOne({ _id: new Types.ObjectId(postId) }, { status })
      .exec();

    return result.modifiedCount > 0;
  }

  async likePost(postId: string, userId: string): Promise<boolean> {
    try {
      // Check if the post exists
      const post = await this.postModel.findById(postId).exec();
      if (!post) {
        throw new BadRequestException('პოსტი ვერ მოიძებნა');
      }

      // Check if the user already liked this post
      const existingLike = await this.likeModel
        .findOne({
          userId: new Types.ObjectId(userId),
          targetId: postId,
          type: LikeType.POST,
        })
        .exec();

      if (existingLike) {
        // User already liked this post
        return false;
      }

      // Create a new like record
      const newLike = new this.likeModel({
        userId: new Types.ObjectId(userId),
        targetId: postId,
        type: LikeType.POST,
      });
      await newLike.save();

      // Increment the like count on the post
      const result = await this.postModel
        .updateOne({ _id: new Types.ObjectId(postId) }, { $inc: { likes: 1 } })
        .exec();

      // Give XP to the user for liking a post
      try {
        await this.achievementsService.addXp(
          userId,
          XP_ACTIVITIES[ActivityType.LIKE_POST].xp,
          ActivityType.LIKE_POST,
          postId,
          'Post',
        );

        // Give XP to the post owner for receiving a like
        const postOwnerId = post.userId.toString();
        if (postOwnerId !== userId) {
          await this.achievementsService.addXp(
            postOwnerId,
            XP_ACTIVITIES[ActivityType.RECEIVE_POST_LIKE].xp,
            ActivityType.RECEIVE_POST_LIKE,
            postId,
            'Post',
          );
        }
      } catch (error) {
        // Log but don't halt execution
        console.error('Error awarding XP for post like:', error);
      }

      return result.modifiedCount > 0;
    } catch (error) {
      if (error.code === 11000) {
        return false;
      }
      throw error;
    }
  }

  async createComment(
    postId: string,
    userId: string,
    userName: string,
    userAvatar: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentResponseDto> {
    // Create new comment
    const newComment = new this.commentModel({
      postId: new Types.ObjectId(postId),
      userId: new Types.ObjectId(userId),
      content: createCommentDto.content,
    });

    const savedComment = await newComment.save();

    // Increment comment count on post
    await this.postModel.updateOne(
      { _id: new Types.ObjectId(postId) },
      { $inc: { commentsCount: 1 } },
    );

    // Add XP for creating a comment
    try {
      await this.achievementsService.addXp(
        userId,
        XP_ACTIVITIES[ActivityType.CREATE_COMMENT].xp,
        ActivityType.CREATE_COMMENT,
        savedComment._id.toString(),
        'Comment',
      );
    } catch (error) {
      // Log but don't halt execution
      console.error('Error awarding XP for comment creation:', error);
    }

    // Return response
    return {
      id: savedComment._id.toString(),
      userId,
      userName,
      userAvatar,
      postId,
      content: savedComment.content,
      likes: savedComment.likes,
      createdAt: savedComment.createdAt,
      updatedAt: savedComment.updatedAt,
    };
  }

  async getCommentsByPostId(postId: string): Promise<CommentResponseDto[]> {
    const comments = await this.commentModel
      .find({ postId: new Types.ObjectId(postId) })
      .sort({ createdAt: -1 })
      .populate({
        path: 'userId',
        select: 'fullName photo',
      })
      .exec();

    return comments.map((comment) => {
      const user = comment.userId as any;
      return {
        id: comment._id.toString(),
        userId: user ? user._id.toString() : '',
        userName: user ? user.fullName : '',
        userAvatar: user ? user.photo || '' : '',
        postId: comment.postId.toString(),
        content: comment.content,
        likes: comment.likes,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };
    });
  }

  async likeComment(commentId: string, userId: string): Promise<boolean> {
    try {
      // Check if the comment exists
      const comment = await this.commentModel.findById(commentId).exec();
      if (!comment) {
        throw new BadRequestException('კომენტარი ვერ მოიძებნა');
      }

      // Check if the user already liked this comment
      const existingLike = await this.likeModel
        .findOne({
          userId: new Types.ObjectId(userId),
          targetId: commentId,
          type: LikeType.COMMENT,
        })
        .exec();

      if (existingLike) {
        // User already liked this comment
        return false;
      }

      // Create a new like record
      const newLike = new this.likeModel({
        userId: new Types.ObjectId(userId),
        targetId: commentId,
        type: LikeType.COMMENT,
      });
      await newLike.save();

      // Increment the like count on the comment
      const result = await this.commentModel
        .updateOne(
          { _id: new Types.ObjectId(commentId) },
          { $inc: { likes: 1 } },
        )
        .exec();

      // Give XP to the user for liking a comment
      try {
        await this.achievementsService.addXp(
          userId,
          XP_ACTIVITIES[ActivityType.LIKE_POST].xp,
          ActivityType.LIKE_POST,
          commentId,
          'Comment',
        );

        // Give XP to the comment owner for receiving a like
        const commentOwnerId = comment.userId.toString();
        if (commentOwnerId !== userId) {
          // Don't award XP if user liked their own comment
          await this.achievementsService.addXp(
            commentOwnerId,
            XP_ACTIVITIES[ActivityType.RECEIVE_COMMENT_LIKE].xp,
            ActivityType.RECEIVE_COMMENT_LIKE,
            commentId,
            'Comment',
          );
        }
      } catch (error) {
        // Log but don't halt execution
        console.error('Error awarding XP for comment like:', error);
      }

      return result.modifiedCount > 0;
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error, user already liked this comment
        return false;
      }
      throw error;
    }
  }

  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    const like = await this.likeModel
      .findOne({
        userId: new Types.ObjectId(userId),
        targetId: postId,
        type: LikeType.POST,
      })
      .exec();

    return !!like;
  }

  async hasUserLikedComment(
    commentId: string,
    userId: string,
  ): Promise<boolean> {
    const like = await this.likeModel
      .findOne({
        userId: new Types.ObjectId(userId),
        targetId: commentId,
        type: LikeType.COMMENT,
      })
      .exec();

    return !!like;
  }

  async unlikePost(postId: string, userId: string): Promise<boolean> {
    // Check if the post exists
    const post = await this.postModel.findById(postId).exec();
    if (!post) {
      throw new BadRequestException('პოსტი ვერ მოიძებნა');
    }

    // Find and delete the like
    const deleteResult = await this.likeModel
      .deleteOne({
        userId: new Types.ObjectId(userId),
        targetId: postId,
        type: LikeType.POST,
      })
      .exec();

    if (deleteResult.deletedCount === 0) {
      // No like was found to delete
      return false;
    }

    // Decrement the like count on the post
    const result = await this.postModel
      .updateOne({ _id: new Types.ObjectId(postId) }, { $inc: { likes: -1 } })
      .exec();

    // Note: We don't remove XP for unlikes to keep the system simple
    // This is a common practice in gamification systems

    return result.modifiedCount > 0;
  }

  async unlikeComment(commentId: string, userId: string): Promise<boolean> {
    // Check if the comment exists
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) {
      throw new BadRequestException('კომენტარი ვერ მოიძებნა');
    }

    // Find and delete the like
    const deleteResult = await this.likeModel
      .deleteOne({
        userId: new Types.ObjectId(userId),
        targetId: commentId,
        type: LikeType.COMMENT,
      })
      .exec();

    if (deleteResult.deletedCount === 0) {
      // No like was found to delete
      return false;
    }

    // Decrement the like count on the comment
    const result = await this.commentModel
      .updateOne(
        { _id: new Types.ObjectId(commentId) },
        { $inc: { likes: -1 } },
      )
      .exec();

    // Note: We don't remove XP for unlikes to keep the system simple

    return result.modifiedCount > 0;
  }
}
