import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { MapService } from '../services/map.service';
import { VenueMapView, VenueMapViewSchema } from '../schemas/venue-map-view.schema';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('MapService with MongoDB 2dsphere', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  let service: MapService;

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
    const model = mongoose.model(VenueMapView.name, VenueMapViewSchema);
    await model.createIndexes();
    const expiresAt = new Date(Date.now() + 60_000);
    await model.insertMany([
      { slug: 'near-cafe', name: 'Near café', category: 'CAFE', cuisineTypes: ['COFFEE'], address: 'Near', location: { type: 'Point', coordinates: [106.7009, 10.7769] }, priceTier: 1, rating: 4.5, crowdLevel: 'QUIET', tablesAvailable: 4, availabilityExpiresAt: expiresAt },
      { slug: 'near-restaurant', name: 'Near restaurant', category: 'RESTAURANT', cuisineTypes: ['WESTERN'], address: 'Near', location: { type: 'Point', coordinates: [106.7011, 10.777] }, priceTier: 2, rating: 4, crowdLevel: 'BUSY', tablesAvailable: 0, availabilityExpiresAt: expiresAt },
      { slug: 'far-cafe', name: 'Far café', category: 'CAFE', cuisineTypes: ['DESSERT'], address: 'Far', location: { type: 'Point', coordinates: [106.7319, 10.8025] }, priceTier: 1, rating: 5, crowdLevel: 'QUIET', tablesAvailable: 8, availabilityExpiresAt: expiresAt },
    ]);
    service = new MapService(model as never);
  });

  afterAll(async () => {
    // This database has a unique generated test-only name.
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('filters by radius before returning public results', async () => {
    const result = await service.findNearby({ lat: 10.7769, lng: 106.7009, radiusM: 100 });
    expect(result.data.map((venue) => venue.slug)).toEqual(['near-cafe', 'near-restaurant']);
    expect(result.data[0].distanceM).toBe(0);
  });

  it('applies category and availability filters inside the geo query', async () => {
    const result = await service.findNearby({ lat: 10.7769, lng: 106.7009, radiusM: 100, category: 'CAFE', hasAvailability: 'true' });
    expect(result.data.map((venue) => venue.slug)).toEqual(['near-cafe']);
    expect(result.data[0].availability.freshness).toBe('FRESH');
  });

  it('filters cuisine in MongoDB before applying the result limit', async () => {
    const result = await service.findNearby({ lat: 10.7769, lng: 106.7009, radiusM: 100, cuisine: 'WESTERN' });
    expect(result.data.map((venue) => venue.slug)).toEqual(['near-restaurant']);
  });
});
