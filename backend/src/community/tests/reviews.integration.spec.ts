import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { ReviewsService } from '../services/reviews.service';
import { VenuesService } from '../../venues/services/venues.service';
import { AuthService } from '../../auth/services/auth.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('reviews with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;

  beforeAll(async () => { await mongoose.connect(testUri!, { dbName }); });
  afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  it('upserts only the author review and pages public reviews without duplicates', async () => {
    const model = mongoose.model(Review.name, ReviewSchema);
    await model.createIndexes();
    const venues = { activeLocation: jest.fn().mockResolvedValue([106.7, 10.77]) } as unknown as VenuesService;
    const auth = { publicUsersByIds: jest.fn().mockImplementation(async (ids: Types.ObjectId[]) => ids.map((id) => ({ id: id.toString(), displayName: 'Demo User' }))) } as unknown as AuthService;
    const service = new ReviewsService(model, venues, auth);
    const authorId = new Types.ObjectId().toString();
    await service.upsert(authorId, 'demo-cafe', { rating: 4, body: 'Không gian thoải mái.' });
    await service.upsert(authorId, 'demo-cafe', { rating: 5, body: 'Dịch vụ rất tốt hôm nay.' });
    expect(await model.countDocuments({ userId: new Types.ObjectId(authorId) })).toBe(1);
    await model.insertMany(Array.from({ length: 21 }, (_, index) => ({
      userId: new Types.ObjectId(), venueSlug: 'demo-cafe', rating: 3, body: `Review công khai ${index}`,
      status: 'PUBLISHED', createdAt: new Date(Date.now() - (index + 1) * 1000), updatedAt: new Date(),
    })));
    const first = await service.list('demo-cafe');
    const second = await service.list('demo-cafe', first.meta.nextCursor!);
    expect(first.data).toHaveLength(20);
    expect(second.data).toHaveLength(2);
    expect(new Set([...first.data, ...second.data].map((review) => review.id)).size).toBe(22);
    expect(first.data[0]).toMatchObject({ rating: 5, body: 'Dịch vụ rất tốt hôm nay.', author: { displayName: 'Demo User' } });
    await expect(service.list('another-cafe', first.meta.nextCursor!)).rejects.toThrow('Invalid review cursor');
    await service.remove(authorId, 'demo-cafe');
    expect(await model.countDocuments({ userId: new Types.ObjectId(authorId) })).toBe(0);
  });
});
