import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AchievementsService } from './achievements.service';
import { ActivityType } from '../models/xp-activity.model';
import { ExchangeRequestDto } from './dto/exchange.dto';

@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  async getUserAchievements(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('xp')
  async getUserXp(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.getUserXp(userId);
  }

  @Post('claim/:achievementId')
  async claimReward(@Req() req, @Param('achievementId') achievementId: string) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.claimReward(userId, achievementId);
  }

  @Post('daily-login')
  async checkDailyLogin(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.checkDailyLogin(userId);
  }

  @Post('weekly-check')
  async checkWeeklyActivity(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.checkWeeklyActivity(userId);
  }

  @Post('complete-profile')
  async completeProfile(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.addXp(
      userId,
      this.achievementsService['XP_ACTIVITIES'][ActivityType.COMPLETE_PROFILE]
        .xp,
      ActivityType.COMPLETE_PROFILE,
    );
  }

  // New endpoints for exchange functionality
  @Get('exchange/items')
  async getAvailableExchangeItems(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.getAvailableExchangeItems(userId);
  }

  @Post('exchange')
  async exchangeXpForReward(
    @Req() req,
    @Body() exchangeRequest: ExchangeRequestDto,
  ) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.exchangeXpForReward(
      userId,
      exchangeRequest,
    );
  }

  @Get('rewards')
  async getUserRewards(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    return this.achievementsService.getUserRewards(userId);
  }

  @Post('rewards/:rewardId/use')
  async useReward(@Req() req, @Param('rewardId') rewardId: string) {
    const userId = req.user.userId || req.user.sub;
    const success = await this.achievementsService.useReward(userId, rewardId);
    return { success };
  }
}
