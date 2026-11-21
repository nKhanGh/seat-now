import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Follow, FollowSchema } from '../schemas/follow.schema';
import { FollowsService } from '../services/follows.service';
import { AuthService } from '../../auth/services/auth.service';
import { ReviewsService } from '../services/reviews.service';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { ReviewPhoto, ReviewPhotoSchema } from '../schemas/review-photo.schema';
import { ReviewReport, ReviewReportSchema } from '../schemas/review-report.schema';
import { Venue, VenueSchema } from '../../map/schemas/venue.schema';
import { VenuesService } from '../../venues/services/venues.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('follows with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('prevents self-follow, deduplicates and isolates following lists', async () => {
    const model = mongoose.model(Follow.name, FollowSchema);
    await model.createIndexes();
    const reviewModel = mongoose.model(Review.name, ReviewSchema);
    const photos = mongoose.model(ReviewPhoto.name, ReviewPhotoSchema);
    const reports = mongoose.model(ReviewReport.name, ReviewReportSchema);
    const venueModel = mongoose.model(Venue.name, VenueSchema);
    const auth = {
      publicProfileById: jest
        .fn()
        .mockImplementation(async (id: string) => ({ id, displayName: 'Demo User' })),
      publicUsersByIds: jest
        .fn()
        .mockImplementation(async (ids: Types.ObjectId[]) =>
          ids.map((id) => ({ id: id.toString(), displayName: 'Demo User' })),
        ),
    } as unknown as AuthService;
    const reviews = new ReviewsService(reviewModel, photos, reports, venueModel, {} as VenuesService, auth);
    const service = new FollowsService(model, auth, reviews);
    const alice = new Types.ObjectId().toString();
    const bob = new Types.ObjectId().toString();
    const charlie = new Types.ObjectId().toString();
    await expect(service.follow(alice, alice)).rejects.toThrow('Cannot follow yourself');
    await service.follow(alice, bob);
    await service.follow(alice, bob);
    expect((await service.publicProfile(bob)).data.followers).toBe(1);
    expect((await service.list(alice)).data).toMatchObject([{ id: bob }]);
    expect((await service.list(charlie)).data).toEqual([]);
    await venueModel.create({
      slug: 'cafe-a',
      name: 'Café A',
      category: 'CAFE',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      address: 'Quận 1, TP.HCM',
      priceTier: 2,
      rating: 4.5,
    });
    await reviewModel.insertMany([
      { userId: new Types.ObjectId(bob), venueSlug: 'cafe-a', rating: 5, body: 'Review từ Bob' },
      { userId: new Types.ObjectId(charlie), venueSlug: 'cafe-a', rating: 1, body: 'Review từ Charlie' },
    ]);
    expect((await service.feed(alice)).data).toMatchObject([
      { venueName: 'Café A', body: 'Review từ Bob', author: { id: bob } },
    ]);
    expect((await service.feed(charlie)).data).toEqual([]);
    expect((await service.isFollowing(alice, bob)).data.following).toBe(true);
    await service.unfollow(alice, bob);
    expect((await service.isFollowing(alice, bob)).data.following).toBe(false);
    expect((await service.feed(alice)).data).toEqual([]);
  });
});
