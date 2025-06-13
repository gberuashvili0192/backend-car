import { ActivityType } from '../models/xp-activity.model';
import { RewardType } from '../models/reward.model';

// XP values for different activities
export const XP_ACTIVITIES = {
  [ActivityType.CREATE_POST]: { xp: 50, description: 'პოსტის შექმნა' },
  [ActivityType.LIKE_POST]: { xp: 2, description: 'პოსტის მოწონება' },
  [ActivityType.RECEIVE_POST_LIKE]: {
    xp: 5,
    description: 'პოსტის მოწონების მიღება',
  },
  [ActivityType.CREATE_COMMENT]: { xp: 10, description: 'კომენტარის დაწერა' },
  [ActivityType.RECEIVE_COMMENT_LIKE]: {
    xp: 2,
    description: 'კომენტარის მოწონების მიღება',
  },
  [ActivityType.DAILY_LOGIN]: { xp: 5, description: 'ყოველდღიური შესვლა' },
  [ActivityType.WEEKLY_ACTIVE]: {
    xp: 25,
    description: 'კვირაში მინიმუმ 5 აქტივობა',
  },
  [ActivityType.COMPLETE_PROFILE]: { xp: 20, description: 'პროფილის შევსება' },
  [ActivityType.USE_SERVICE]: { xp: 30, description: 'სერვისის გამოყენება' },
  [ActivityType.REVIEW_SERVICE]: {
    xp: 15,
    description: 'მომსახურების შეფასება',
  },
  [ActivityType.INVITE_FRIEND]: { xp: 100, description: 'მეგობრის მოწვევა' },
  [ActivityType.REFERRED_SERVICE_USE]: {
    xp: 50,
    description: 'მოწვეული მეგობრის მიერ სერვისის გამოყენება',
  },
  [ActivityType.XP_EXCHANGE]: {
    xp: 0, // This is a special activity that doesn't add XP but tracks exchanges
    description: 'XP-ის გაცვლა საჩუქარზე',
  },
};

// Achievement levels configuration
export const ACHIEVEMENT_LEVELS = [
  {
    level: 1,
    name: 'დამწყები',
    requiredXp: 0,
    description: 'კეთილი იყოს თქვენი მობრძანება CARX საზოგადოებაში!',
    rewards: [],
  },
  {
    level: 2,
    name: 'შემსწავლელი',
    requiredXp: 100,
    description: 'თქვენ იწყებთ აქტიურობას ჩვენს პლატფორმაზე',
    rewards: [{ type: RewardType.BADGE, value: 'learner' }],
  },
  {
    level: 3,
    name: 'აქტიური წევრი',
    requiredXp: 300,
    description: 'თქვენ ხდებით ჩვენი აქტიური წევრი!',
    rewards: [
      { type: RewardType.BADGE, value: 'active_member' },
      { type: RewardType.DISCOUNT, value: 5 }, // 5% discount on auto parts
      { type: RewardType.DISCOUNT, value: 5 }, // 5% discount on car wash
    ],
  },
  {
    level: 4,
    name: 'ექსპერტი',
    requiredXp: 700,
    description: 'თქვენი ცოდნა და აქტიურობა სხვებს ეხმარება!',
    rewards: [
      { type: RewardType.BADGE, value: 'expert' },
      { type: RewardType.DISCOUNT, value: 10 }, // 10% discount on services
      { type: RewardType.DISCOUNT, value: 5 }, // 5% discount on gas
      { type: RewardType.FREE_SERVICE, value: 'car_wash' }, // 1 free car wash
    ],
  },
  {
    level: 5,
    name: 'ოსტატი',
    requiredXp: 1500,
    description: 'თქვენ ხართ ნამდვილი პროფესიონალი!',
    rewards: [
      { type: RewardType.BADGE, value: 'master' },
      { type: RewardType.FREE_SERVICE, value: 'consultation' }, // Free consultation
      { type: RewardType.DISCOUNT, value: 15 }, // 15% discount on services
      { type: RewardType.DISCOUNT, value: 10 }, // 10% discount on gas
      { type: RewardType.FREE_SERVICE, value: 'car_wash_3' }, // 3 free car washes
    ],
  },
  {
    level: 6,
    name: 'ლეგენდა',
    requiredXp: 3000,
    description: 'თქვენ უკვე ლეგენდა ხართ!',
    rewards: [
      { type: RewardType.BADGE, value: 'legend' },
      { type: RewardType.BADGE, value: 'vip' }, // VIP status badge
      { type: RewardType.DISCOUNT, value: 20 }, // 20% discount on all services
      { type: RewardType.DISCOUNT, value: 15 }, // 15% discount on gas
      { type: RewardType.FREE_SERVICE, value: 'premium_month' }, // 1 month free premium subscription
      { type: RewardType.FREE_SERVICE, value: 'car_wash_5' }, // 5 free car washes
    ],
  },
];

// Function to calculate current level based on XP
export function getCurrentLevel(xp: number): number {
  for (let i = ACHIEVEMENT_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= ACHIEVEMENT_LEVELS[i].requiredXp) {
      return ACHIEVEMENT_LEVELS[i].level;
    }
  }
  return 1; // Default to level 1
}
