import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { Venue, VenueSchema } from './map/schemas/venue.schema';
import { VenueMapView, VenueMapViewSchema } from './map/schemas/venue-map-view.schema';
import { AvailabilityLatest, AvailabilityLatestSchema, AvailabilitySnapshot, AvailabilitySnapshotSchema } from './availability/schemas/availability-snapshot.schema';

const demoVenues = [
  { slug: 'demo-cafe-nguyen-hue', name: 'SeatNow Demo Café Nguyễn Huệ', category: 'CAFE', address: 'Nguyễn Huệ, Quận 1, TP.HCM', lng: 106.7038, lat: 10.7758, priceTier: 2, rating: 4.5, crowdLevel: 'QUIET', tables: { total: 20, available: 8 }, seats: { total: 70, available: 26 }, wait: 0 },
  { slug: 'demo-bistro-dong-khoi', name: 'SeatNow Demo Bistro Đồng Khởi', category: 'RESTAURANT', address: 'Đồng Khởi, Quận 1, TP.HCM', lng: 106.7049, lat: 10.7782, priceTier: 3, rating: 4.3, crowdLevel: 'MODERATE', tables: { total: 18, available: 4 }, seats: { total: 64, available: 12 }, wait: 10 },
  { slug: 'demo-cinema-le-loi', name: 'SeatNow Demo Cinema Lê Lợi', category: 'CINEMA', address: 'Lê Lợi, Quận 1, TP.HCM', lng: 106.6989, lat: 10.7737, priceTier: 3, rating: 4.1, crowdLevel: 'BUSY', tables: null, seats: { total: 140, available: 18 }, wait: 15 },
  { slug: 'demo-cafe-ben-thanh', name: 'SeatNow Demo Café Bến Thành', category: 'CAFE', address: 'Bến Thành, Quận 1, TP.HCM', lng: 106.6957, lat: 10.7721, priceTier: 1, rating: 4.0, crowdLevel: 'UNKNOWN', tables: null, seats: null, wait: null },
  { slug: 'demo-restaurant-thao-dien', name: 'SeatNow Demo Restaurant Thảo Điền', category: 'RESTAURANT', address: 'Thảo Điền, TP. Thủ Đức, TP.HCM', lng: 106.7319, lat: 10.8025, priceTier: 4, rating: 4.8, crowdLevel: 'QUIET', tables: { total: 30, available: 12 }, seats: { total: 110, available: 42 }, wait: 0 },
] as const;

async function seedDemo() {
  await ConfigModule.forRoot();
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const venues = mongoose.model(Venue.name, VenueSchema);
    const views = mongoose.model(VenueMapView.name, VenueMapViewSchema);
    const snapshots = mongoose.model(AvailabilitySnapshot.name, AvailabilitySnapshotSchema);
    const latest = mongoose.model(AvailabilityLatest.name, AvailabilityLatestSchema);
    const capturedAt = new Date();
    const expiresAt = new Date(capturedAt.getTime() + 10 * 60_000);
    const version = capturedAt.getTime();
    for (const item of demoVenues) {
      const location = { type: 'Point', coordinates: [item.lng, item.lat] };
      const profile = { name: item.name, category: item.category, address: item.address, location, priceTier: item.priceTier, rating: item.rating, status: 'ACTIVE' };
      await venues.updateOne({ slug: item.slug }, { $set: profile }, { upsert: true });
      const availability = item.tables || item.seats ? {
        slug: item.slug, version, tables: item.tables, seats: item.seats, crowdLevel: item.crowdLevel,
        estimatedWaitMinutes: item.wait, acceptingGuests: true, source: 'DEMO', confidence: 0.8,
        capturedAt, expiresAt,
      } : null;
      if (availability) {
        await snapshots.create({ ...availability, sourceRecordId: randomUUID() });
        await latest.updateOne({ slug: item.slug }, { $set: availability }, { upsert: true });
      } else {
        await latest.deleteOne({ slug: item.slug });
      }
      await views.updateOne({ slug: item.slug }, { $set: {
        ...profile, crowdLevel: availability?.crowdLevel ?? 'UNKNOWN',
        tablesAvailable: availability?.tables?.available ?? null, tablesTotal: availability?.tables?.total ?? null,
        seatsAvailable: availability?.seats?.available ?? null, seatsTotal: availability?.seats?.total ?? null,
        estimatedWaitMinutes: availability?.estimatedWaitMinutes ?? null,
        acceptingGuests: availability?.acceptingGuests ?? null,
        availabilitySource: availability?.source ?? null, availabilityConfidence: availability?.confidence ?? null,
        availabilityVersion: availability?.version ?? null,
        availabilityCapturedAt: availability?.capturedAt ?? null, availabilityExpiresAt: availability?.expiresAt ?? null,
      } }, { upsert: true });
    }
    console.log(`Seeded ${demoVenues.length} fictional demo venues`);
  } finally {
    await mongoose.disconnect();
  }
}

void seedDemo().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
