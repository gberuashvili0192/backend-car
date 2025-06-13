import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ItemCategory } from '../../models/exchange-item.model';
import { RewardType } from '../../models/reward.model';

export class ExchangeItemDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsEnum(ItemCategory)
  category: ItemCategory;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  xpCost: number;

  @IsString()
  icon: string;

  @IsString()
  color: string;

  available: boolean;
}

export class ExchangeRequestDto {
  @IsNotEmpty()
  @IsString()
  itemId: string;

  @IsNotEmpty()
  @IsNumber()
  xpCost: number;
}

export class RewardResponseDto {
  @IsNotEmpty()
  @IsEnum(RewardType)
  type: RewardType;

  value: string | number;

  @IsString()
  code: string;

  expiresAt: Date;
}

export class ExchangeResponseDto {
  success: boolean;
  newXP: number;
  reward: RewardResponseDto;
  message?: string;
}

export class UserRewardDto {
  id: string;
  type: RewardType;
  name: string;
  code: string;
  receivedAt: Date;
  expiresAt: Date;
  used: boolean;
}

export class UserRewardsResponseDto {
  rewards: UserRewardDto[];
}

export class AvailableItemsResponseDto {
  items: ExchangeItemDto[];
}
