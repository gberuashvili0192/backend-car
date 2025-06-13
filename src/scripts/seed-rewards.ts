import { MongoClient } from 'mongodb';
import { DEFAULT_REWARDS } from '../constants/default-rewards';
import { config } from 'dotenv';
import { Types } from 'mongoose';
import { RewardType } from '../models/reward.model';

// Load environment variables
config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/carx';

// Helper function to generate a code
const generateCode = (type: RewardType) => {
  const prefix = type.substring(0, 3).toUpperCase();
  const randomPart = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomPart}`;
};

async function seedRewards() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const rewardsCollection = db.collection('rewards');

    // Clear existing rewards
    await rewardsCollection.deleteMany({});
    console.log('Cleared existing rewards');

    // Prepare rewards with required fields
    const rewardsToInsert = DEFAULT_REWARDS.map((reward) => {
      // Set expiration date - 30 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      // Create a dummy user ID (you might want to change this in production)
      const dummyUserId = new Types.ObjectId();

      return {
        userId: dummyUserId,
        achievementId: `default_${reward.type.toLowerCase()}`,
        type: reward.type,
        name: reward.name,
        description: reward.description,
        code:
          reward.type === RewardType.DISCOUNT ||
          reward.type === RewardType.FREE_SERVICE ||
          reward.type === RewardType.VIP_STATUS
            ? generateCode(reward.type)
            : null,
        discountPercent:
          reward.type === RewardType.DISCOUNT
            ? (reward as any).discountPercent
            : null,
        badge: reward.type === RewardType.BADGE ? (reward as any).badge : null,
        expiresAt: reward.type !== RewardType.BADGE ? expiresAt : null,
        claimed: false,
        used: false,
        sourceType: 'default',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    // Insert rewards
    const result = await rewardsCollection.insertMany(rewardsToInsert);
    console.log(`Inserted ${result.insertedCount} rewards`);
  } catch (error) {
    console.error('Error seeding rewards:', error);
  } finally {
    await client.close();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding
seedRewards().catch(console.error);
