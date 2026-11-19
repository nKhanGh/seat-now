import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Follow, FollowSchema } from '../schemas/follow.schema';
import { FollowsService } from '../services/follows.service';
import { AuthService } from '../../auth/services/auth.service';

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
    const service = new FollowsService(model, auth);
    const alice = new Types.ObjectId().toString();
    const bob = new Types.ObjectId().toString();
    const charlie = new Types.ObjectId().toString();
    await expect(service.follow(alice, alice)).rejects.toThrow('Cannot follow yourself');
    await service.follow(alice, bob);
    await service.follow(alice, bob);
    expect((await service.publicProfile(bob)).data.followers).toBe(1);
    expect((await service.list(alice)).data).toMatchObject([{ id: bob }]);
    expect((await service.list(charlie)).data).toEqual([]);
    expect((await service.isFollowing(alice, bob)).data.following).toBe(true);
    await service.unfollow(alice, bob);
    expect((await service.isFollowing(alice, bob)).data.following).toBe(false);
  });
});
