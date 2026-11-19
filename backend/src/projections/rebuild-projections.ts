import { Model } from 'mongoose';
import { Venue } from '../map/schemas/venue.schema';
import { VenueMapView } from '../map/schemas/venue-map-view.schema';
import { AvailabilityLatest, AvailabilitySnapshot } from '../availability/schemas/availability-snapshot.schema';
import { ParkingFacility } from '../parking/schemas/parking-facility.schema';
import { ParkingSnapshot } from '../parking/schemas/parking-snapshot.schema';

type Models = {
  venues: Model<Venue>;
  views: Model<VenueMapView>;
  availabilitySnapshots: Model<AvailabilitySnapshot>;
  availabilityLatest: Model<AvailabilityLatest>;
  parking: Model<ParkingFacility>;
  parkingSnapshots: Model<ParkingSnapshot>;
};

export async function rebuildProjections(models: Models) {
  let venueProfiles = 0;
  let venueAvailability = 0;
  let parkingAvailability = 0;

  for await (const venue of models.venues.find().lean().cursor()) {
    await models.views.updateOne({ slug: venue.slug }, { $set: {
      name: venue.name, category: venue.category, cuisineTypes: venue.cuisineTypes ?? [],
      location: venue.location, address: venue.address, priceTier: venue.priceTier,
      rating: venue.rating, status: venue.status,
      hasLogo: venue.hasLogo ?? false, businessPremiumExpiresAt: venue.businessPremiumExpiresAt ?? null,
    } }, { upsert: true });
    venueProfiles++;
  }

  const venueSnapshots = models.availabilitySnapshots.aggregate<{ _id: string; record: AvailabilitySnapshot }>([
    { $sort: { slug: 1, version: -1 } },
    { $group: { _id: '$slug', record: { $first: '$$ROOT' } } },
  ]).cursor();
  for await (const { record } of venueSnapshots) {
    const latestRecord = {
      slug: record.slug, version: record.version, tables: record.tables, seats: record.seats,
      crowdLevel: record.crowdLevel, estimatedWaitMinutes: record.estimatedWaitMinutes,
      acceptingGuests: record.acceptingGuests, source: record.source,
      confidence: record.confidence, capturedAt: record.capturedAt, expiresAt: record.expiresAt,
    };
    try {
      await models.availabilityLatest.updateOne(
        { slug: record.slug, $or: [{ version: { $lt: record.version } }, { version: { $exists: false } }] },
        { $set: latestRecord }, { upsert: true },
      );
    } catch (error) { if (!isDuplicate(error)) throw error; }
    const latest = await models.availabilityLatest.findOne({ slug: record.slug }).lean();
    if (!latest) continue;
    const result = await models.views.updateOne(
      { slug: record.slug, $or: [{ availabilityVersion: { $lt: latest.version } }, { availabilityVersion: null }] },
      { $set: {
        availabilityVersion: latest.version, crowdLevel: latest.crowdLevel,
        tablesAvailable: latest.tables?.available ?? null, tablesTotal: latest.tables?.total ?? null,
        seatsAvailable: latest.seats?.available ?? null, seatsTotal: latest.seats?.total ?? null,
        estimatedWaitMinutes: latest.estimatedWaitMinutes, acceptingGuests: latest.acceptingGuests,
        availabilitySource: latest.source, availabilityConfidence: latest.confidence,
        availabilityCapturedAt: latest.capturedAt, availabilityExpiresAt: latest.expiresAt,
      } },
    );
    venueAvailability += result.modifiedCount;
  }

  const parkingSnapshots = models.parkingSnapshots.aggregate<{ _id: string; record: ParkingSnapshot }>([
    { $sort: { facilitySlug: 1, version: -1 } },
    { $group: { _id: '$facilitySlug', record: { $first: '$$ROOT' } } },
  ]).cursor();
  for await (const { record } of parkingSnapshots) {
    const result = await models.parking.updateOne(
      { slug: record.facilitySlug, status: 'ACTIVE', $or: [{ availabilityVersion: { $lt: record.version } }, { availabilityVersion: null }] },
      { $set: {
        availabilityVersion: record.version, availableSpaces: record.availableSpaces,
        totalSpaces: record.totalSpaces, availabilitySource: record.source,
        availabilityConfidence: record.confidence, availabilityCapturedAt: record.capturedAt,
        availabilityExpiresAt: record.expiresAt,
      } },
    );
    parkingAvailability += result.modifiedCount;
  }
  return { venueProfiles, venueAvailability, parkingAvailability };
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
