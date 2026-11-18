import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { ParkingService } from '../services/parking.service';
import { ParkingFacility, ParkingFacilitySchema } from '../schemas/parking-facility.schema';
import { ParkingSnapshot, ParkingSnapshotSchema } from '../schemas/parking-snapshot.schema';
import { VenueMapView, VenueMapViewSchema } from '../../map/schemas/venue-map-view.schema';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('ParkingService with MongoDB 2dsphere', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  let service: ParkingService;

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
    const facilities = mongoose.model(ParkingFacility.name, ParkingFacilitySchema);
    const snapshots = mongoose.model(ParkingSnapshot.name, ParkingSnapshotSchema);
    const venues = mongoose.model(VenueMapView.name, VenueMapViewSchema);
    await Promise.all([facilities.createIndexes(), snapshots.createIndexes(), venues.createIndexes()]);
    await venues.create({ slug: 'test-cafe', name: 'Test café', category: 'CAFE', address: 'Test', location: { type: 'Point', coordinates: [106.7, 10.77] }, priceTier: 2, rating: 4 });
    const common = { status: 'ACTIVE', vehicleTypes: ['MOTORBIKE'], open24h: true, pricing: { kind: 'HOURLY', amountMinor: 10000, currency: 'VND', unit: 'HOUR', note: null } };
    await facilities.insertMany([
      { ...common, slug: 'linked', name: 'Linked', address: 'Near', kind: 'VENUE', venueSlugs: ['test-cafe'], location: { type: 'Point', coordinates: [106.7002, 10.7702] }, availabilityVersion: 2, availableSpaces: 3, totalSpaces: 10, availabilityCapturedAt: new Date(), availabilityExpiresAt: new Date(Date.now() + 60_000) },
      { ...common, slug: 'public', name: 'Public', address: 'Near', kind: 'PUBLIC', venueSlugs: [], location: { type: 'Point', coordinates: [106.7001, 10.7701] }, availabilityVersion: 1, availableSpaces: 0, totalSpaces: 20, availabilityCapturedAt: new Date(), availabilityExpiresAt: new Date(Date.now() - 60_000) },
      { ...common, slug: 'far', name: 'Far', address: 'Far', kind: 'PUBLIC', venueSlugs: [], location: { type: 'Point', coordinates: [106.73, 10.8] } },
    ]);
    service = new ParkingService(facilities, snapshots, venues);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('ranks linked parking first and returns straight-line distance and pricing', async () => {
    const result = await service.forVenue('test-cafe', { radiusM: 500 });
    expect(result.data.map((item) => item.slug)).toEqual(['linked', 'public']);
    expect(result.data[0]).toMatchObject({ linkedToVenue: true, relation: 'VENUE', pricing: { amountMinor: 10000, unit: 'HOUR' } });
    expect(result.meta.distanceType).toBe('STRAIGHT_LINE');
    expect(result.data[1].availability.freshness).toBe('STALE');
  });

  it('filters fresh free spaces inside the geospatial query', async () => {
    const result = await service.forVenue('test-cafe', { radiusM: 500, vehicleType: 'MOTORBIKE', hasAvailability: 'true' });
    expect(result.data.map((item) => item.slug)).toEqual(['linked']);
  });

  it('accepts only newer parking snapshots and deduplicates records', async () => {
    const payload = { version: 3, availableSpaces: 2, totalSpaces: 10, source: 'DEMO', sourceRecordId: 'parking-3', confidence: 0.8, capturedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60_000).toISOString() };
    expect((await service.ingest('linked', payload)).latestUpdated).toBe(true);
    expect((await service.ingest('linked', payload)).duplicate).toBe(true);
    expect((await service.ingest('linked', { ...payload, version: 1, sourceRecordId: 'parking-1' })).latestUpdated).toBe(false);
    expect((await service.getBySlug('linked')).data.availability.availableSpaces).toBe(2);
  });
});
