import mongoose, { Types } from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Favorite, FavoriteSchema } from '../schemas/favorite.schema';
import { FavoritesService } from '../services/favorites.service';
import { VenuesService } from '../../venues/services/venues.service';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('favorites with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('is idempotent and isolates one user’s saved venues from another', async () => {
    const model = mongoose.model(Favorite.name, FavoriteSchema);
    await model.createIndexes();
    const venues = {
      activeLocation: jest.fn().mockResolvedValue([106.7, 10.77]),
      publicProfilesBySlugs: jest.fn().mockResolvedValue([
        {
          slug: 'demo-cafe',
          name: 'Demo café',
          category: 'CAFE',
          address: 'Test',
          location: { type: 'Point', coordinates: [106.7, 10.77] },
          priceTier: 1,
          rating: 4,
        },
      ]),
    } as unknown as VenuesService;
    const service = new FavoritesService(model, venues);
    const alice = new Types.ObjectId().toString();
    const bob = new Types.ObjectId().toString();
    await service.save(alice, 'demo-cafe');
    await service.save(alice, 'demo-cafe');
    expect((await service.list(alice)).data).toMatchObject([{ slug: 'demo-cafe' }]);
    expect((await service.list(bob)).data).toEqual([]);
    expect(await model.countDocuments()).toBe(1);
    await service.remove(alice, 'demo-cafe');
    expect((await service.list(alice)).data).toEqual([]);
  });
});
