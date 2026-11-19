import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';
import { User, UserSchema } from './auth/schemas/user.schema';
import { UserSubscription, UserSubscriptionSchema } from './subscription/schemas/user-subscription.schema';

async function seedPremium() {
  await ConfigModule.forRoot();
  if (process.env.NODE_ENV === 'production') throw new Error('Premium fixture is disabled in production');
  const uri = process.env.MONGODB_URI;
  const email = process.env.SEED_PREMIUM_EMAIL?.trim().toLowerCase();
  if (!uri || !email) throw new Error('MONGODB_URI and SEED_PREMIUM_EMAIL are required');
  await mongoose.connect(uri);
  try {
    const users = mongoose.model(User.name, UserSchema);
    const subscriptions = mongoose.model(UserSubscription.name, UserSubscriptionSchema);
    const user = await users.findOne({ emailNormalized: email });
    if (!user) throw new Error('Demo user not found');
    const now = new Date();
    await subscriptions.updateOne(
      { userId: user._id },
      {
        $set: {
          plan: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60_000),
          cancelAtPeriodEnd: false,
        },
      },
      { upsert: true },
    );
    console.log('Activated local Premium fixture for the selected demo user');
  } finally {
    await mongoose.disconnect();
  }
}

void seedPremium().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
