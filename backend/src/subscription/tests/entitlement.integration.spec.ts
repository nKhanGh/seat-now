import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { EntitlementService } from '../services/entitlement.service';
import { UserSubscription, UserSubscriptionSchema } from '../schemas/user-subscription.schema';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('EntitlementService with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  let service: EntitlementService;
  let subscriptions: mongoose.Model<UserSubscription>;
  const userId = new mongoose.Types.ObjectId();
  const now = new Date('2026-11-19T10:00:00.000Z');

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
    subscriptions = mongoose.model(UserSubscription.name, UserSubscriptionSchema);
    await subscriptions.createIndexes();
    service = new EntitlementService(subscriptions);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('returns free for a user without a record and premium only during an active period', async () => {
    expect((await service.entitlements(userId.toString(), now)).plan).toBe('FREE');
    await subscriptions.create({ userId, plan: 'PREMIUM', status: 'ACTIVE', currentPeriodStart: new Date('2026-11-01'), currentPeriodEnd: new Date('2026-12-01'), cancelAtPeriodEnd: false });
    expect((await service.entitlements(userId.toString(), now)).entitlements['booking.priority']).toBe(true);
    expect((await service.entitlements(userId.toString(), new Date('2026-12-01'))).entitlements['booking.priority']).toBe(false);
  });
});
