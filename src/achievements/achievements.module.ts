import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserXp, UserXpSchema } from '../models/user-xp.model';
import { XpActivity, XpActivitySchema } from '../models/xp-activity.model';
import { Reward, RewardSchema } from '../models/reward.model';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';
import {
  ExchangeItem,
  ExchangeItemSchema,
} from '../models/exchange-item.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: UserXp.name, schema: UserXpSchema },
      { name: XpActivity.name, schema: XpActivitySchema },
      { name: Reward.name, schema: RewardSchema },
      { name: ExchangeItem.name, schema: ExchangeItemSchema },
    ]),
  ],
  controllers: [AchievementsController],
  providers: [AchievementsService],
  exports: [AchievementsService],
})
export class AchievementsModule {}
