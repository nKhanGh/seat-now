import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { ReviewsService } from '../services/reviews.service';
import { VenuesService } from '../../venues/services/venues.service';
import { AuthService } from '../../auth/services/auth.service';
import { ReviewPhoto, ReviewPhotoSchema } from '../schemas/review-photo.schema';
import { ReviewReport, ReviewReportSchema } from '../schemas/review-report.schema';
import sharp from 'sharp';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('reviews with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('upserts only the author review and pages public reviews without duplicates', async () => {
    const model = mongoose.model(Review.name, ReviewSchema);
    const photos = mongoose.model(ReviewPhoto.name, ReviewPhotoSchema);
    const reports = mongoose.model(ReviewReport.name, ReviewReportSchema);
    await Promise.all([model.createIndexes(), photos.createIndexes(), reports.createIndexes()]);
    const venues = {
      activeLocation: jest.fn().mockResolvedValue([106.7, 10.77]),
      updateCommunityRating: jest.fn().mockResolvedValue(undefined),
    } as unknown as VenuesService;
    const auth = {
      publicUsersByIds: jest
        .fn()
        .mockImplementation(async (ids: Types.ObjectId[]) =>
          ids.map((id) => ({ id: id.toString(), displayName: 'Demo User' })),
        ),
    } as unknown as AuthService;
    const service = new ReviewsService(model, photos, reports, venues, auth);
    const authorId = new Types.ObjectId().toString();
    await service.upsert(authorId, 'demo-cafe', { rating: 4, body: 'Không gian thoải mái.' });
    await service.upsert(authorId, 'demo-cafe', { rating: 5, body: 'Dịch vụ rất tốt hôm nay.' });
    expect(venues.updateCommunityRating).toHaveBeenLastCalledWith('demo-cafe', 5);
    expect(await model.countDocuments({ userId: new Types.ObjectId(authorId) })).toBe(1);
    await model.insertMany(
      Array.from({ length: 21 }, (_, index) => ({
        userId: new Types.ObjectId(),
        venueSlug: 'demo-cafe',
        rating: 3,
        body: `Review công khai ${index}`,
        status: 'PUBLISHED',
        createdAt: new Date(Date.now() - (index + 1) * 1000),
        updatedAt: new Date(),
      })),
    );
    const first = await service.list('demo-cafe');
    const second = await service.list('demo-cafe', first.meta.nextCursor!);
    expect(first.data).toHaveLength(20);
    expect(second.data).toHaveLength(2);
    expect(new Set([...first.data, ...second.data].map((review) => review.id)).size).toBe(22);
    expect(first.data[0]).toMatchObject({
      rating: 5,
      body: 'Dịch vụ rất tốt hôm nay.',
      author: { displayName: 'Demo User' },
    });
    const image = await sharp({ create: { width: 3, height: 3, channels: 3, background: '#ff0000' } })
      .jpeg()
      .toBuffer();
    await service.uploadPhoto(authorId, 'demo-cafe', { buffer: image, size: image.length });
    const photo = await service.getPhoto(first.data[0].id);
    expect((await sharp(photo).metadata()).format).toBe('webp');
    expect((await service.list('demo-cafe')).data[0].photoUrl).toContain('/photo');
    const reporterId = new Types.ObjectId().toString();
    await service.report(reporterId, first.data[0].id, 'SPAM');
    await service.report(reporterId, first.data[0].id, 'ABUSE');
    expect((await service.pendingReports()).data).toMatchObject([
      { reviewId: first.data[0].id, reportCount: 1 },
    ]);
    await expect(service.report(authorId, first.data[0].id, 'SPAM')).rejects.toThrow(
      'Cannot report your own review',
    );
    await service.hide(first.data[0].id);
    expect((await service.list('demo-cafe')).data.some((review) => review.id === first.data[0].id)).toBe(
      false,
    );
    await expect(service.getPhoto(first.data[0].id)).rejects.toThrow('Photo not found');
    await expect(
      service.upsert(authorId, 'demo-cafe', { rating: 5, body: 'Không thể đăng lại review.' }),
    ).rejects.toThrow('Review is hidden');
    expect((await service.pendingReports()).data).toHaveLength(0);
    await expect(service.list('another-cafe', first.meta.nextCursor!)).rejects.toThrow(
      'Invalid review cursor',
    );
    await service.remove(authorId, 'demo-cafe');
    expect(
      await model.findOne({ userId: new Types.ObjectId(authorId) }, { body: 1, status: 1 }).lean(),
    ).toMatchObject({ body: 'Review đã xóa.', status: 'HIDDEN' });
    await expect(
      service.upsert(authorId, 'demo-cafe', { rating: 5, body: 'Vẫn không thể đăng lại.' }),
    ).rejects.toThrow('Review is hidden');
    await expect(service.getPhoto(first.data[0].id)).rejects.toThrow('Photo not found');
    const starsOnly = new Types.ObjectId().toString();
    await service.upsert(starsOnly, 'demo-cafe', { rating: 4 });
    expect((await model.findOne({ userId: new Types.ObjectId(starsOnly) }).lean())?.body).toBe('');
  });
});
