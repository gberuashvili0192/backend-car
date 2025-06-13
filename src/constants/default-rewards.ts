import { RewardType } from '../models/reward.model';

// Default rewards that can be loaded into the database
export const DEFAULT_REWARDS = [
  {
    type: RewardType.BADGE,
    name: 'დამწყები მძღოლი',
    badge: 'beginner_driver',
    description: 'პირველი ნაბიჯები CARX-ზე',
  },
  {
    type: RewardType.DISCOUNT,
    name: '10% ფასდაკლება ავტორეცხვაზე',
    discountPercent: 10,
    description: 'სპეციალური ფასდაკლება ავტორეცხვაზე',
  },
  {
    type: RewardType.FREE_SERVICE,
    name: 'უფასო დიაგნოსტიკა',
    description: 'ერთჯერადი უფასო დიაგნოსტიკა',
  },
  {
    type: RewardType.BADGE,
    name: 'აქტიური მძღოლი',
    badge: 'active_driver',
    description: 'აქტიური მონაწილეობა CARX საზოგადოებაში',
  },
  {
    type: RewardType.VIP_STATUS,
    name: 'VIP სტატუსი - 1 თვე',
    description: 'ერთთვიანი VIP სტატუსი',
  }
]; 