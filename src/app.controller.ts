import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { AchievementsService } from './achievements/achievements.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly achievementsService: AchievementsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Route to handle the /users/achievements endpoint
  @Get('users/achievements')
  @UseGuards(JwtAuthGuard)
  async getUserAchievements(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    try {
      return await this.achievementsService.getUserAchievements(userId);
    } catch {
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

  // Route to handle the /users/achievements/daily-login endpoint
  @Post('users/achievements/daily-login')
  @UseGuards(JwtAuthGuard)
  async userDailyLogin(@Req() req) {
    const userId = req.user.userId || req.user.sub;
    try {
      return await this.achievementsService.checkDailyLogin(userId);
    } catch {
      // Return default response in case of error
      return {
        success: false,
        error: 'Failed to process daily login',
        xp: 0,
        level: 1,
        levelUp: false,
      };
    }
  }
}
