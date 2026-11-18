import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';
import { Venue, VenueSchema } from './map/schemas/venue.schema';
import { VenueMapView, VenueMapViewSchema } from './map/schemas/venue-map-view.schema';

const demoVenues = [
  { slug: 'demo-cafe-nguyen-hue', name: 'SeatNow Demo Café Nguyễn Huệ', category: 'CAFE', address: 'Nguyễn Huệ, Quận 1, TP.HCM', lng: 106.7038, lat: 10.7758, priceTier: 2, rating: 4.5, crowdLevel: 'QUIET', tablesAvailable: 8 },
  { slug: 'demo-bistro-dong-khoi', name: 'SeatNow Demo Bistro Đồng Khởi', category: 'RESTAURANT', address: 'Đồng Khởi, Quận 1, TP.HCM', lng: 106.7049, lat: 10.7782, priceTier: 3, rating: 4.3, crowdLevel: 'MODERATE', tablesAvailable: 4 },
  { slug: 'demo-cinema-le-loi', name: 'SeatNow Demo Cinema Lê Lợi', category: 'CINEMA', address: 'Lê Lợi, Quận 1, TP.HCM', lng: 106.6989, lat: 10.7737, priceTier: 3, rating: 4.1, crowdLevel: 'BUSY', tablesAvailable: 0 },
  { slug: 'demo-cafe-ben-thanh', name: 'SeatNow Demo Café Bến Thành', category: 'CAFE', address: 'Bến Thành, Quận 1, TP.HCM', lng: 106.6957, lat: 10.7721, priceTier: 1, rating: 4.0, crowdLevel: 'UNKNOWN', tablesAvailable: null },
  { slug: 'demo-restaurant-thao-dien', name: 'SeatNow Demo Restaurant Thảo Điền', category: 'RESTAURANT', address: 'Thảo Điền, TP. Thủ Đức, TP.HCM', lng: 106.7319, lat: 10.8025, priceTier: 4, rating: 4.8, crowdLevel: 'QUIET', tablesAvailable: 12 },
] as const;

async function seedDemo() {
  await ConfigModule.forRoot();
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production');
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const venues = mongoose.model(Venue.name, VenueSchema);
    const views = mongoose.model(VenueMapView.name, VenueMapViewSchema);
    for (const item of demoVenues) {
      const location = { type: 'Point', coordinates: [item.lng, item.lat] };
      const profile = { name: item.name, category: item.category, address: item.address, location, priceTier: item.priceTier, rating: item.rating, status: 'ACTIVE' };
      await venues.updateOne({ slug: item.slug }, { $set: profile }, { upsert: true });
      await views.updateOne({ slug: item.slug }, { $set: { ...profile, crowdLevel: item.crowdLevel, tablesAvailable: item.tablesAvailable, availabilityExpiresAt: item.tablesAvailable === null ? null : new Date(Date.now() + 10 * 60_000) } }, { upsert: true });
    }
    console.log(`Seeded ${demoVenues.length} fictional demo venues`);
  } finally {
    await mongoose.disconnect();
  }
}

void seedDemo().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
