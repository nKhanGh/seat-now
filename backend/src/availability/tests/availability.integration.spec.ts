import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import {
  AvailabilityLatest,
  AvailabilityLatestSchema,
  AvailabilitySnapshot,
  AvailabilitySnapshotSchema,
} from '../schemas/availability-snapshot.schema';
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
    await views.create({
      slug: 'test-cafe',
      name: 'Test café',
      category: 'CAFE',
      address: 'Test',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      priceTier: 2,
      rating: 4,
    });
    await views.create({
      slug: 'other-cafe',
      name: 'Other café',
      category: 'CAFE',
      address: 'Test',
      location: { type: 'Point', coordinates: [106.701, 10.77] },
      priceTier: 2,
      rating: 4,
    });
    service = new AvailabilityService(snapshots, latest, views, new LiveGateway());
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  const payload = (version: number, sourceRecordId: string) => ({
    version,
    sourceRecordId,
    tables: { total: 20, available: 8 },
    seats: { total: 70, available: 26 },
    crowdLevel: 'QUIET',
    estimatedWaitMinutes: 5,
    acceptingGuests: true,
    source: 'DEMO',
    confidence: 0.8,
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
    const history = await service.historyForSlug('test-cafe');
    expect(history.data.map((row) => row.version).sort()).toEqual([11, 12]);
    expect(history.data.every((row) => row.freshness === 'FRESH')).toBe(true);
    expect(history.meta).toEqual({ truncated: false, windowHours: 24 });
    expect((await service.historyForSlug('other-cafe')).data).toEqual([]);
  });

  it('rejects contradictory capacity and preserves current data', async () => {
    await expect(
      service.ingest('test-cafe', { ...payload(13, 'bad-record'), tables: { total: 5, available: 8 } }),
    ).rejects.toThrow('Available capacity exceeds total');
    expect((await service.getBySlug('test-cafe')).data.version).toBe(12);
  });

  it('rejects a source record reused for another venue', async () => {
    await expect(service.ingest('other-cafe', payload(12, 'record-12'))).rejects.toThrow(
      'Availability version already exists',
    );
    expect((await service.getBySlug('other-cafe')).data.freshness).toBe('UNKNOWN');
  });

  it('bounds public history to ten records from the past day', async () => {
    const snapshots = mongoose.model(AvailabilitySnapshot.name);
    const now = Date.now();
    await snapshots.insertMany(
      Array.from({ length: 12 }, (_, index) => ({
        slug: 'other-cafe',
        version: index + 1,
        tables: { total: 20, available: index },
        crowdLevel: 'MODERATE',
        acceptingGuests: true,
        source: 'DEMO',
        sourceRecordId: `history-${index}`,
        confidence: 0.8,
        capturedAt: new Date(now - index * 60_000),
        expiresAt: new Date(now - index * 60_000 + 10 * 60_000),
      })),
    );
    await snapshots.create({
      slug: 'other-cafe',
      version: 13,
      crowdLevel: 'QUIET',
      acceptingGuests: true,
      source: 'DEMO',
      sourceRecordId: 'history-old',
      confidence: 0.8,
      capturedAt: new Date(now - 48 * 60 * 60_000),
      expiresAt: new Date(now - 48 * 60 * 60_000 + 10 * 60_000),
    });
    const history = await service.historyForSlug('other-cafe');
    expect(history.data.map((row) => row.version)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(history.meta.truncated).toBe(true);
    await expect(service.historyForSlug('not-published')).rejects.toMatchObject({ status: 404 });
  });

  it('reports stale and unknown without pretending availability is live', async () => {
    const stale = await service.getBySlug('test-cafe');
    expect(stale.data.freshness).toBe('FRESH');
    expect(publicAvailability(null).freshness).toBe('UNKNOWN');
    expect(
      publicAvailability({
        ...stale.data,
        capturedAt: new Date(),
        expiresAt: new Date(Date.now() - 1000),
      } as never).freshness,
    ).toBe('STALE');
    const unknown = await service.getBySlug('test-cafe-missing').catch((error: unknown) => error);
    expect(unknown).toMatchObject({ status: 404 });
  });

  it('publishes a short-lived operator update without changing provider snapshots', async () => {
    await expect(
      service.operatorUpdate('test-cafe', { crowdLevel: 'QUIET', acceptingGuests: true }),
    ).rejects.toThrow('Tables or seats are required');
    const result = await service.operatorUpdate('test-cafe', {
      tables: { total: 20, available: 6 },
      crowdLevel: 'MODERATE',
      estimatedWaitMinutes: 12,
      acceptingGuests: true,
    });
    expect(result.latestUpdated).toBe(true);
    expect(result.data).toMatchObject({
      source: 'OPERATOR',
      crowdLevel: 'MODERATE',
      tables: { total: 20, available: 6 },
      freshness: 'FRESH',
    });
    expect(
      (new Date(result.data.expiresAt!).getTime() - new Date(result.data.capturedAt!).getTime()) / 60_000,
    ).toBe(10);
    expect((await views.findOne({ slug: 'test-cafe' }))?.tablesAvailable).toBe(6);
    const dashboard = await service.sevenDayOccupancy('test-cafe');
    expect(dashboard.samples).toBeGreaterThan(0);
    expect(dashboard.sourceCounts.OPERATOR).toBe(1);
    expect(dashboard.peakHours[0].averagePercent).toBeGreaterThanOrEqual(0);
    await expect(
      service.operatorUpdate('test-cafe', {
        tables: { total: 2, available: 3 },
        crowdLevel: 'QUIET',
        acceptingGuests: true,
      }),
    ).rejects.toThrow('Available capacity exceeds total');
  });
});
