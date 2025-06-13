import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserXp, UserXpDocument } from '../models/user-xp.model';
import {
  XpActivity,
  XpActivityDocument,
  ActivityType,
} from '../models/xp-activity.model';
import { Reward, RewardDocument, RewardType } from '../models/reward.model';
import {
  XP_ACTIVITIES,
  ACHIEVEMENT_LEVELS,
  getCurrentLevel,
} from '../constants/achievement-constants';
import {
  ExchangeItem,
  ExchangeItemDocument,
  ItemCategory,
} from '../models/exchange-item.model';
import {
  ExchangeRequestDto,
  ExchangeResponseDto,
  UserRewardDto,
} from './dto/exchange.dto';
import { DEFAULT_EXCHANGE_ITEMS } from '../constants/exchange-items';
import { OnModuleInit } from '@nestjs/common';

@Injectable()
export class AchievementsService implements OnModuleInit {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectModel(UserXp.name) private userXpModel: Model<UserXpDocument>,
    @InjectModel(XpActivity.name)
    private xpActivityModel: Model<XpActivityDocument>,
    @InjectModel(Reward.name) private rewardModel: Model<RewardDocument>,
    @InjectModel(ExchangeItem.name)
    private exchangeItemModel: Model<ExchangeItemDocument>,
  ) {}

  /**
   * Initialize default exchange items when the module starts
   */
  async onModuleInit() {
    await this.initializeExchangeItems();
  }

  /**
   * Initialize default exchange items in the database
   */
  private async initializeExchangeItems() {
    try {
      const count = await this.exchangeItemModel.countDocuments();
      if (count === 0) {
        this.logger.log('Initializing default exchange items...');
        await this.exchangeItemModel.insertMany(DEFAULT_EXCHANGE_ITEMS);
        this.logger.log(
          `Added ${DEFAULT_EXCHANGE_ITEMS.length} default exchange items`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error initializing exchange items: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Get or create a user XP record
   */
  async getUserXpRecord(userId: string): Promise<UserXpDocument> {
    // Use findOneAndUpdate to atomically find or create record
    const userXp = await this.userXpModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      { $setOnInsert: { userId: new Types.ObjectId(userId), xp: 0 } },
      { new: true, upsert: true },
    );

    return userXp;
  }

  /**
   * Get user's current XP and level
   */
  async getUserXp(userId: string): Promise<{ xp: number; level: number }> {
    try {
      const userXp = await this.getUserXpRecord(userId);
      const level = getCurrentLevel(userXp.xp);

      return {
        xp: userXp.xp,
        level,
      };
    } catch (error) {
      this.logger.error(`Error getting user XP: ${error.message}`, error.stack);
      // Return default values in case of error
      return {
        xp: 0,
        level: 1,
      };
    }
  }

  /**
   * Add XP to a user and check for level up
   */
  async addXp(
    userId: string,
    amount: number,
    activity: ActivityType,
    sourceId: string = null,
    sourceType: string = null,
  ): Promise<{ xp: number; level: number; levelUp: boolean }> {
    // Validate activity type
    if (!Object.keys(XP_ACTIVITIES).includes(activity)) {
      throw new BadRequestException('Invalid activity type');
    }

    // Get current XP and level
    const userXp = await this.getUserXpRecord(userId);
    const currentLevel = getCurrentLevel(userXp.xp);

    // Add XP with MongoDB atomic operation
    const updatedUserXp = await this.userXpModel.findOneAndUpdate(
      { _id: userXp._id },
      { $inc: { xp: amount } },
      { new: true },
    );

    // Save activity history
    const xpActivity = new this.xpActivityModel({
      userId: new Types.ObjectId(userId),
      activity,
      xpAmount: amount,
      sourceId,
      sourceType,
    });
    await xpActivity.save();

    // Check if new level reached
    const newLevel = getCurrentLevel(updatedUserXp.xp);
    const levelUp = newLevel > currentLevel;

    // If level up, automatically create rewards
    if (levelUp) {
      try {
        for (let i = currentLevel + 1; i <= newLevel; i++) {
          const levelData = ACHIEVEMENT_LEVELS.find(
            (level) => level.level === i,
          );
          if (levelData && levelData.rewards && levelData.rewards.length > 0) {
            await Promise.all(
              levelData.rewards.map((rewardData) =>
                this.createReward(userId, `level_${i}`, rewardData),
              ),
            );
          }
        }
      } catch (error) {
        this.logger.error(
          `Error creating rewards for level up: ${error.message}`,
          error.stack,
        );
        // Continue execution even if reward creation fails
      }
    }

    return {
      xp: updatedUserXp.xp,
      level: newLevel,
      levelUp,
    };
  }

  /**
   * Create a reward for a user
   */
  async createReward(
    userId: string,
    achievementId: string,
    rewardData: { type: RewardType; value: string | number },
  ): Promise<RewardDocument> {
    // Generate unique code for discount or free service
    const generateCode = () => {
      const prefix = rewardData.type.substring(0, 3).toUpperCase();
      const randomPart = Math.floor(10000 + Math.random() * 90000);
      return `${prefix}-${randomPart}`;
    };

    // Set expiration date - 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const reward = new this.rewardModel({
      userId: new Types.ObjectId(userId),
      achievementId,
      type: rewardData.type,
      code:
        rewardData.type === RewardType.DISCOUNT ||
        rewardData.type === RewardType.FREE_SERVICE
          ? generateCode()
          : null,
      discountPercent:
        rewardData.type === RewardType.DISCOUNT ? rewardData.value : null,
      badge: rewardData.type === RewardType.BADGE ? rewardData.value : null,
      expiresAt:
        rewardData.type === RewardType.DISCOUNT ||
        rewardData.type === RewardType.FREE_SERVICE
          ? expiresAt
          : null,
      claimed: false,
    });

    await reward.save();
    return reward;
  }

  /**
   * Get user's achievements and rewards
   */
  async getUserAchievements(userId: string): Promise<any> {
    try {
      // Get user's current XP and level
      const { xp, level } = await this.getUserXp(userId);

      // Get user's rewards
      const rewards = await this.rewardModel.find({
        userId: new Types.ObjectId(userId),
      });

      // Format achievements information
      const achievements = ACHIEVEMENT_LEVELS.map((achievementLevel) => {
        const achievementId = `level_${achievementLevel.level}`;
        const achieved = level >= achievementLevel.level;

        // Check if rewards for this achievement level have been claimed
        const claimedRewards = rewards.filter(
          (r) => r.achievementId === achievementId && r.claimed,
        );

        // Check if there are unclaimed rewards for this achievement
        const unclaimedRewards = rewards.filter(
          (r) => r.achievementId === achievementId && !r.claimed,
        );

        return {
          ...achievementLevel,
          achieved,
          claimable: achieved && unclaimedRewards.length > 0,
          claimed: claimedRewards.length > 0,
          rewards: achievementLevel.rewards.map((reward) => ({
            ...reward,
            claimed: claimedRewards.some(
              (r) =>
                r.type === reward.type &&
                ((r.badge === reward.value && r.type === RewardType.BADGE) ||
                  (r.discountPercent === reward.value &&
                    r.type === RewardType.DISCOUNT) ||
                  (r.type === RewardType.FREE_SERVICE && r.code)),
            ),
          })),
        };
      });

      // Get user's claimed badges
      const badges = rewards
        .filter((r) => r.type === RewardType.BADGE && r.claimed)
        .map((r) => r.badge);

      return {
        xp,
        level,
        achievements,
        badges,
        // Progress to next level
        nextLevel: level < ACHIEVEMENT_LEVELS.length ? level + 1 : level,
        nextLevelXp:
          level < ACHIEVEMENT_LEVELS.length
            ? ACHIEVEMENT_LEVELS.find((a) => a.level === level + 1)?.requiredXp
            : null,
        progress:
          level < ACHIEVEMENT_LEVELS.length
            ? Math.min(
                100,
                Math.round(
                  (xp /
                    ACHIEVEMENT_LEVELS.find((a) => a.level === level + 1)
                      ?.requiredXp) *
                    100,
                ),
              )
            : 100,
      };
    } catch (error) {
      this.logger.error(
        `Error getting user achievements: ${error.message}`,
        error.stack,
      );
      // Return empty achievements in case of error
      return {
        xp: 0,
        level: 1,
        achievements: [],
        badges: [],
        nextLevel: 2,
        nextLevelXp: 100,
        progress: 0,
      };
    }
  }

  /**
   * Claim rewards for an achievement
   */
  async claimReward(
    userId: string,
    achievementId: string,
  ): Promise<{ achievementId: string; rewards: any[] }> {
    // Check if user has reached this achievement level
    const { level } = await this.getUserXp(userId);
    const requiredLevel = parseInt(achievementId.replace('level_', ''));

    if (isNaN(requiredLevel) || level < requiredLevel) {
      throw new BadRequestException(
        'You have not reached this achievement level yet',
      );
    }

    // Find unclaimed rewards for this achievement
    const unclaimedRewards = await this.rewardModel.find({
      userId: new Types.ObjectId(userId),
      achievementId,
      claimed: false,
    });

    if (unclaimedRewards.length === 0) {
      throw new BadRequestException(
        'No unclaimed rewards for this achievement',
      );
    }

    // Claim rewards
    const claimedRewards = [];

    for (const reward of unclaimedRewards) {
      reward.claimed = true;
      reward.claimedAt = new Date();
      await reward.save();
      claimedRewards.push(reward);
    }

    return {
      achievementId,
      rewards: claimedRewards.map((reward) => ({
        type: reward.type,
        code: reward.code,
        discountPercent: reward.discountPercent,
        badge: reward.badge,
        expiresAt: reward.expiresAt,
      })),
    };
  }

  /**
   * Check daily login and award XP if eligible
   */
  async checkDailyLogin(userId: string): Promise<any> {
    try {
      const userXp = await this.getUserXpRecord(userId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already received XP today
      if (
        !userXp.lastDailyLoginDate ||
        new Date(userXp.lastDailyLoginDate) < today
      ) {
        // Update the last daily login date
        await this.userXpModel.updateOne(
          { _id: userXp._id },
          { lastDailyLoginDate: new Date() },
        );

        // Add XP for daily login
        return this.addXp(
          userId,
          XP_ACTIVITIES[ActivityType.DAILY_LOGIN].xp,
          ActivityType.DAILY_LOGIN,
        );
      }

      // User already received daily login XP today
      return {
        success: true,
        alreadyClaimed: true,
        message: 'Daily login XP already claimed today',
        xp: userXp.xp,
        level: getCurrentLevel(userXp.xp),
        levelUp: false,
      };
    } catch (error) {
      this.logger.error(
        `Error checking daily login: ${error.message}`,
        error.stack,
      );
      // Return a fallback response
      return {
        success: false,
        error: 'Failed to process daily login',
        xp: 0,
        level: 1,
        levelUp: false,
      };
    }
  }

  /**
   * Check weekly activity bonus
   */
  async checkWeeklyActivity(userId: string): Promise<any> {
    const userXp = await this.getUserXpRecord(userId);
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check if already received weekly bonus recently
    if (
      !userXp.lastWeeklyRewardDate ||
      new Date(userXp.lastWeeklyRewardDate) < oneWeekAgo
    ) {
      // Check if there are enough activities
      const activityCount = await this.xpActivityModel.countDocuments({
        userId: new Types.ObjectId(userId),
        createdAt: { $gte: oneWeekAgo },
      });

      // If 5+ activities, give bonus
      if (activityCount >= 5) {
        // Update last weekly reward date
        await this.userXpModel.updateOne(
          { _id: userXp._id },
          { lastWeeklyRewardDate: new Date() },
        );

        // Add XP for weekly activity
        return this.addXp(
          userId,
          XP_ACTIVITIES[ActivityType.WEEKLY_ACTIVE].xp,
          ActivityType.WEEKLY_ACTIVE,
        );
      }
    }

    return null;
  }

  /**
   * Get available exchange items for a user
   */
  async getAvailableExchangeItems(userId: string): Promise<any> {
    try {
      // Get user's current XP
      const { xp } = await this.getUserXp(userId);

      // Get all active exchange items
      const items = await this.exchangeItemModel.find({ active: true }).exec();

      // Mark items as available or not based on user's XP
      return {
        items: items.map((item) => ({
          id: item.id,
          category: item.category,
          name: item.name,
          description: item.description,
          xpCost: item.xpCost,
          icon: item.icon,
          color: item.color,
          available: xp >= item.xpCost,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error getting available exchange items: ${error.message}`,
        error.stack,
      );
      return { items: [] };
    }
  }

  /**
   * Exchange XP for a reward
   */
  async exchangeXpForReward(
    userId: string,
    exchangeRequest: ExchangeRequestDto,
  ): Promise<ExchangeResponseDto> {
    try {
      // Find the exchange item
      const item = await this.exchangeItemModel
        .findOne({
          id: exchangeRequest.itemId,
          active: true,
        })
        .exec();

      if (!item) {
        return {
          success: false,
          newXP: 0,
          reward: null,
          message: 'Item not found or not available',
        };
      }

      // Verify the XP cost matches
      if (item.xpCost !== exchangeRequest.xpCost) {
        return {
          success: false,
          newXP: 0,
          reward: null,
          message: 'Invalid XP cost provided',
        };
      }

      // Get user's current XP
      const userXp = await this.getUserXpRecord(userId);

      // Check if user has enough XP
      if (userXp.xp < item.xpCost) {
        return {
          success: false,
          newXP: userXp.xp,
          reward: null,
          message: 'Not enough XP',
        };
      }

      // Deduct XP from user
      const updatedUserXp = await this.userXpModel.findOneAndUpdate(
        { _id: userXp._id },
        { $inc: { xp: -item.xpCost } },
        { new: true },
      );

      // Generate reward based on item category
      const reward = await this.generateRewardFromExchange(userId, item);

      // Save activity history
      const xpActivity = new this.xpActivityModel({
        userId: new Types.ObjectId(userId),
        activity: ActivityType.XP_EXCHANGE,
        xpAmount: -item.xpCost,
        sourceId: item.id,
        sourceType: 'ExchangeItem',
      });
      await xpActivity.save();

      return {
        success: true,
        newXP: updatedUserXp.xp,
        reward: {
          type: reward.type as RewardType,
          value:
            reward.type === RewardType.DISCOUNT
              ? reward.discountPercent
              : reward.badge,
          code: reward.code,
          expiresAt: reward.expiresAt,
        },
        message: 'Exchange successful',
      };
    } catch (error) {
      this.logger.error(
        `Error exchanging XP for reward: ${error.message}`,
        error.stack,
      );
      return {
        success: false,
        newXP: 0,
        reward: null,
        message: 'Failed to process exchange',
      };
    }
  }

  /**
   * Generate a reward from an exchange item
   */
  private async generateRewardFromExchange(
    userId: string,
    item: ExchangeItemDocument,
  ): Promise<RewardDocument> {
    // Generate unique code for discount or free service
    const generateCode = () => {
      const prefix = item.category.substring(0, 3).toUpperCase();
      const randomPart = Math.floor(10000 + Math.random() * 90000);
      return `${prefix}-${randomPart}`;
    };

    // Set expiration date - 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    let rewardType: RewardType;
    let value: string | number = null;
    let code: string = null;

    switch (item.category) {
      case ItemCategory.DISCOUNT:
        rewardType = RewardType.DISCOUNT;
        // Extract discount percentage from item name or description
        const discountMatch = item.description.match(/(\d+)%/);
        value = discountMatch ? parseInt(discountMatch[1]) : 5;
        code = generateCode();
        break;
      case ItemCategory.SERVICE:
        rewardType = RewardType.FREE_SERVICE;
        code = generateCode();
        break;
      case ItemCategory.BADGE:
        rewardType = RewardType.BADGE;
        value = item.id;
        break;
      case ItemCategory.PREMIUM:
        rewardType = RewardType.VIP_STATUS;
        code = generateCode();
        break;
      default:
        rewardType = RewardType.BADGE;
        value = 'default_badge';
    }

    const reward = new this.rewardModel({
      userId: new Types.ObjectId(userId),
      achievementId: `exchange_${item.id}`,
      type: rewardType,
      code,
      discountPercent: rewardType === RewardType.DISCOUNT ? value : null,
      badge: rewardType === RewardType.BADGE ? value : null,
      name: item.name,
      expiresAt: rewardType !== RewardType.BADGE ? expiresAt : null,
      claimed: true,
      claimedAt: new Date(),
      used: false,
      sourceType: 'exchange',
    });

    await reward.save();
    return reward;
  }

  /**
   * Get user's rewards
   */
  async getUserRewards(userId: string): Promise<{ rewards: UserRewardDto[] }> {
    try {
      const rewards = await this.rewardModel
        .find({
          userId: new Types.ObjectId(userId),
          claimed: true,
        })
        .sort({ claimedAt: -1 })
        .exec();

      return {
        rewards: rewards.map((reward) => ({
          id: reward._id.toString(),
          type: reward.type as RewardType,
          name: reward.name || this.getRewardName(reward),
          code: reward.code,
          receivedAt: reward.claimedAt,
          expiresAt: reward.expiresAt,
          used: reward.used,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Error getting user rewards: ${error.message}`,
        error.stack,
      );
      return { rewards: [] };
    }
  }

  /**
   * Mark a reward as used
   */
  async useReward(userId: string, rewardId: string): Promise<boolean> {
    try {
      const reward = await this.rewardModel.findOne({
        _id: new Types.ObjectId(rewardId),
        userId: new Types.ObjectId(userId),
        claimed: true,
        used: false,
      });

      if (!reward) {
        return false;
      }

      // Check if expired
      if (reward.expiresAt && new Date() > reward.expiresAt) {
        return false;
      }

      reward.used = true;
      reward.usedAt = new Date();
      await reward.save();

      return true;
    } catch (error) {
      this.logger.error(`Error using reward: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * Helper method to get a reward name
   */
  private getRewardName(reward: RewardDocument): string {
    switch (reward.type) {
      case RewardType.BADGE:
        return `Badge: ${reward.badge}`;
      case RewardType.DISCOUNT:
        return `${reward.discountPercent}% Discount`;
      case RewardType.FREE_SERVICE:
        return 'Free Service';
      case RewardType.VIP_STATUS:
        return 'VIP Status';
      default:
        return 'Reward';
    }
  }
}
