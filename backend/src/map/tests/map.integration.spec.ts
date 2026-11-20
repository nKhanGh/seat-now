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
      {
        slug: 'near-cafe',
        name: 'Near café',
        category: 'CAFE',
        cuisineTypes: ['COFFEE'],
        address: 'Near',
        location: { type: 'Point', coordinates: [106.7009, 10.7769] },
        priceTier: 1,
        rating: 4.5,
        crowdLevel: 'QUIET',
        tablesAvailable: 4,
        acceptingGuests: true,
        availabilityExpiresAt: expiresAt,
      },
      {
        slug: 'near-restaurant',
        name: 'Near restaurant',
        category: 'RESTAURANT',
        cuisineTypes: ['WESTERN'],
        address: 'Near',
        location: { type: 'Point', coordinates: [106.7011, 10.777] },
        priceTier: 2,
        rating: 4,
        crowdLevel: 'BUSY',
        tablesAvailable: 0,
        availabilityExpiresAt: expiresAt,
      },
      {
        slug: 'far-cafe',
        name: 'Far café',
        category: 'CAFE',
        cuisineTypes: ['DESSERT'],
        address: 'Far',
        location: { type: 'Point', coordinates: [106.7319, 10.8025] },
        priceTier: 1,
        rating: 5,
        crowdLevel: 'QUIET',
        tablesAvailable: 8,
        availabilityExpiresAt: expiresAt,
      },
    ]);
    service = new MapService(model as never);
  });

  afterAll(async () => {
    // This database has a unique generated test-only name.
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('filters by radius before returning public results', async () => {
    const result = await service.findNearby({ lat: 10.7769, lng: 106.7009, radiusM: 100, limit: 20 });
    expect(result.data.map((venue) => venue.slug)).toEqual(['near-cafe', 'near-restaurant']);
    expect(result.data[0].distanceM).toBe(0);
  });

  it('searches published venues by Vietnamese name outside the current map radius', async () => {
    const model = mongoose.model(VenueMapView.name);
    await model.insertMany([
      {
        slug: 'outside-search',
        name: 'Cà phê Thảo Điền',
        category: 'CAFE',
        address: 'Thủ Đức',
        location: { type: 'Point', coordinates: [106.95, 10.95] },
        priceTier: 2,
        rating: 4.4,
      },
      {
        slug: 'inactive-search',
        name: 'Cà phê Thảo Điền đóng cửa',
        category: 'CAFE',
        address: 'Thủ Đức',
        status: 'INACTIVE',
        location: { type: 'Point', coordinates: [106.95, 10.95] },
        priceTier: 2,
        rating: 4,
      },
    ]);
    const result = await service.searchPublished('thao dien');
    expect(result.data.map((venue) => venue.slug)).toEqual(['outside-search']);
    expect((await service.searchPublished('.*')).data).toEqual([]);
    await model.deleteMany({ slug: { $in: ['outside-search', 'inactive-search'] } });
  });

  it('applies category and availability filters inside the geo query', async () => {
    const result = await service.findNearby({
      lat: 10.7769,
      lng: 106.7009,
      radiusM: 100,
      limit: 20,
      category: 'CAFE',
      hasAvailability: 'true',
    });
    expect(result.data.map((venue) => venue.slug)).toEqual(['near-cafe']);
    expect(result.data[0].availability.freshness).toBe('FRESH');
  });

  it('filters cuisine in MongoDB before applying the result limit', async () => {
    const result = await service.findNearby({
      lat: 10.7769,
      lng: 106.7009,
      radiusM: 100,
      limit: 20,
      cuisine: 'WESTERN',
    });
    expect(result.data.map((venue) => venue.slug)).toEqual(['near-restaurant']);
  });

  it('counts free seats when table counts are unavailable, but excludes closed intake', async () => {
    const model = mongoose.model(VenueMapView.name);
    await model.create({
      slug: 'seats-only',
      name: 'Seats only',
      category: 'CAFE',
      address: 'Near',
      location: { type: 'Point', coordinates: [106.701, 10.7769] },
      priceTier: 1,
      rating: 4,
      seatsAvailable: 5,
      acceptingGuests: true,
      availabilityExpiresAt: new Date(Date.now() + 60_000),
    });
    await model.create({
      slug: 'not-accepting',
      name: 'Not accepting',
      category: 'CAFE',
      address: 'Near',
      location: { type: 'Point', coordinates: [106.701, 10.777] },
      priceTier: 1,
      rating: 4,
      tablesAvailable: 8,
      acceptingGuests: false,
      availabilityExpiresAt: new Date(Date.now() + 60_000),
    });
    const result = await service.findNearby({
      lat: 10.7769,
      lng: 106.7009,
      radiusM: 100,
      limit: 20,
      hasAvailability: 'true',
    });
    expect(result.data.map((venue) => venue.slug)).toEqual(['near-cafe', 'seats-only']);
    await model.deleteMany({ slug: { $in: ['seats-only', 'not-accepting'] } });
  });

  it('paginates by distance and id without repeating venues', async () => {
    const query = { lat: 10.7769, lng: 106.7009, radiusM: 10_000, limit: 1 };
    const first = await service.findNearby(query);
    const second = await service.findNearby({ ...query, cursor: first.meta.nextCursor! });
    const third = await service.findNearby({ ...query, cursor: second.meta.nextCursor! });
    expect([first.data[0].slug, second.data[0].slug, third.data[0].slug]).toEqual([
      'near-cafe',
      'near-restaurant',
      'far-cafe',
    ]);
    expect(third.meta.nextCursor).toBeNull();
    await expect(
      service.findNearby({ ...query, category: 'CAFE', cursor: first.meta.nextCursor! }),
    ).rejects.toThrow('Invalid map cursor');
  });

  it('puts active labeled sponsorship before nearer organic results and pages correctly', async () => {
    const model = mongoose.model(VenueMapView.name);
    await model.updateOne(
      { slug: 'far-cafe' },
      {
        $set: {
          sponsored: true,
          promotionText: 'Ưu đãi thử nghiệm giờ vắng',
          promotionStartsAt: new Date(Date.now() - 60_000),
          promotionEndsAt: new Date(Date.now() + 60_000),
          businessPremiumExpiresAt: new Date(Date.now() + 60_000),
        },
      },
    );
    const query = { lat: 10.7769, lng: 106.7009, radiusM: 10_000, limit: 1 };
    const first = await service.findNearby(query);
    const second = await service.findNearby({ ...query, cursor: first.meta.nextCursor! });
    expect(first.data[0]).toMatchObject({ slug: 'far-cafe', promotion: { sponsored: true } });
    expect(second.data[0].slug).toBe('near-cafe');
    const adFree = await service.findNearby({ ...query, limit: 3 }, true);
    expect(adFree.data.map((venue) => venue.slug)).toEqual(['near-cafe', 'near-restaurant', 'far-cafe']);
    expect(adFree.data[2].promotion).toBeNull();
    await expect(service.findNearby({ ...query, cursor: first.meta.nextCursor! }, true)).rejects.toThrow(
      'Invalid map cursor',
    );
    await model.updateOne(
      { slug: 'far-cafe' },
      { $set: { businessPremiumExpiresAt: new Date(Date.now() - 60_000) } },
    );
    expect((await service.findNearby(query)).data[0].slug).toBe('near-cafe');
  });
});
