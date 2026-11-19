import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { rebuildProjections } from './rebuild-projections';
import { Venue, VenueSchema } from '../map/schemas/venue.schema';
import { VenueMapView, VenueMapViewSchema } from '../map/schemas/venue-map-view.schema';
import {
  AvailabilityLatest,
  AvailabilityLatestSchema,
  AvailabilitySnapshot,
  AvailabilitySnapshotSchema,
} from '../availability/schemas/availability-snapshot.schema';
import { ParkingFacility, ParkingFacilitySchema } from '../parking/schemas/parking-facility.schema';
import { ParkingSnapshot, ParkingSnapshotSchema } from '../parking/schemas/parking-snapshot.schema';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('projection rebuild with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('restores the newest venue and parking snapshots without downgrading on rerun', async () => {
    const models = {
      venues: mongoose.model(Venue.name, VenueSchema),
      views: mongoose.model(VenueMapView.name, VenueMapViewSchema),
      availabilitySnapshots: mongoose.model(AvailabilitySnapshot.name, AvailabilitySnapshotSchema),
      availabilityLatest: mongoose.model(AvailabilityLatest.name, AvailabilityLatestSchema),
      parking: mongoose.model(ParkingFacility.name, ParkingFacilitySchema),
      parkingSnapshots: mongoose.model(ParkingSnapshot.name, ParkingSnapshotSchema),
    };
    await Promise.all(Object.values(models).map((model) => model.createIndexes()));
    await models.venues.create({
      slug: 'rebuild-cafe',
      name: 'Rebuild café',
      category: 'CAFE',
      cuisineTypes: ['COFFEE'],
      description: '',
      address: 'Test',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      priceTier: 1,
      rating: 4,
      status: 'ACTIVE',
    });
    await models.parking.create({
      slug: 'rebuild-parking',
      name: 'Rebuild parking',
      address: 'Test',
      location: { type: 'Point', coordinates: [106.7001, 10.77] },
      kind: 'PUBLIC',
      venueSlugs: [],
      vehicleTypes: ['CAR'],
      open24h: true,
      pricing: { kind: 'FREE', amountMinor: 0, currency: 'VND', unit: 'VISIT' },
      status: 'ACTIVE',
    });
    const capturedAt = new Date();
    const expiresAt = new Date(Date.now() + 60_000);
    await models.availabilitySnapshots.insertMany(
      [1, 2].map((version) => ({
        slug: 'rebuild-cafe',
        version,
        tables: { total: 10, available: version },
        seats: null,
        crowdLevel: 'QUIET',
        estimatedWaitMinutes: 0,
        acceptingGuests: true,
        source: 'DEMO',
        sourceRecordId: `venue-${version}`,
        confidence: 0.8,
        capturedAt,
        expiresAt,
      })),
    );
    await models.parkingSnapshots.insertMany(
      [1, 2].map((version) => ({
        facilitySlug: 'rebuild-parking',
        version,
        availableSpaces: version,
        totalSpaces: 10,
        source: 'DEMO',
        sourceRecordId: `parking-${version}`,
        confidence: 0.8,
        capturedAt,
        expiresAt,
      })),
    );

    const first = await rebuildProjections(models);
    expect(first).toMatchObject({ venueProfiles: 1, venueAvailability: 1, parkingAvailability: 1 });
    expect((await models.views.findOne({ slug: 'rebuild-cafe' }))?.tablesAvailable).toBe(2);
    expect((await models.availabilityLatest.findOne({ slug: 'rebuild-cafe' }))?.version).toBe(2);
    expect((await models.parking.findOne({ slug: 'rebuild-parking' }))?.availableSpaces).toBe(2);
    const second = await rebuildProjections(models);
    expect(second).toMatchObject({ venueAvailability: 0, parkingAvailability: 0 });
  });
});
