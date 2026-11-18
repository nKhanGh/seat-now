import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { AvailabilityLatest, AvailabilityLatestSchema, AvailabilitySnapshot, AvailabilitySnapshotSchema } from '../schemas/availability-snapshot.schema';
import { AvailabilityService, publicAvailability } from '../services/availability.service';
import { VenueMapView, VenueMapViewSchema } from '../../map/schemas/venue-map-view.schema';
import { LiveGateway } from '../../live/live.gateway';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('AvailabilityService with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  let service: AvailabilityService;
  let views: mongoose.Model<VenueMapView>;

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
    const snapshots = mongoose.model(AvailabilitySnapshot.name, AvailabilitySnapshotSchema);
    const latest = mongoose.model(AvailabilityLatest.name, AvailabilityLatestSchema);
    views = mongoose.model(VenueMapView.name, VenueMapViewSchema);
    await Promise.all([snapshots.createIndexes(), latest.createIndexes(), views.createIndexes()]);
    await views.create({ slug: 'test-cafe', name: 'Test café', category: 'CAFE', address: 'Test', location: { type: 'Point', coordinates: [106.7, 10.77] }, priceTier: 2, rating: 4 });
    service = new AvailabilityService(snapshots, latest, views, new LiveGateway());
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  const payload = (version: number, sourceRecordId: string) => ({
    version, sourceRecordId, tables: { total: 20, available: 8 }, seats: { total: 70, available: 26 },
    crowdLevel: 'QUIET', estimatedWaitMinutes: 5, acceptingGuests: true,
    source: 'DEMO', confidence: 0.8,
    capturedAt: new Date(Date.now() - 1000).toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  });

  it('keeps the newest version and deduplicates source records', async () => {
    expect((await service.ingest('test-cafe', payload(12, 'record-12'))).latestUpdated).toBe(true);
    expect((await service.ingest('test-cafe', payload(12, 'record-12'))).duplicate).toBe(true);
    expect((await service.ingest('test-cafe', payload(11, 'record-11'))).latestUpdated).toBe(false);
    const current = await service.getBySlug('test-cafe');
    expect(current.data.version).toBe(12);
    expect(current.data.tables?.available).toBe(8);
    expect((await views.findOne({ slug: 'test-cafe' }))?.availabilityVersion).toBe(12);
  });

  it('rejects contradictory capacity and preserves current data', async () => {
    await expect(service.ingest('test-cafe', { ...payload(13, 'bad-record'), tables: { total: 5, available: 8 } })).rejects.toThrow('Available capacity exceeds total');
    expect((await service.getBySlug('test-cafe')).data.version).toBe(12);
  });

  it('reports stale and unknown without pretending availability is live', async () => {
    const stale = await service.getBySlug('test-cafe');
    expect(stale.data.freshness).toBe('FRESH');
    expect(publicAvailability(null).freshness).toBe('UNKNOWN');
    expect(publicAvailability({ ...stale.data, capturedAt: new Date(), expiresAt: new Date(Date.now() - 1000) } as never).freshness).toBe('STALE');
    const unknown = await service.getBySlug('test-cafe-missing').catch((error: unknown) => error);
    expect(unknown).toMatchObject({ status: 404 });
  });
});
