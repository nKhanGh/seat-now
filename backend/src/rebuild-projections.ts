import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';
import { Venue, VenueSchema } from './map/schemas/venue.schema';
import { VenueMapView, VenueMapViewSchema } from './map/schemas/venue-map-view.schema';
import { AvailabilityLatest, AvailabilityLatestSchema, AvailabilitySnapshot, AvailabilitySnapshotSchema } from './availability/schemas/availability-snapshot.schema';
import { ParkingFacility, ParkingFacilitySchema } from './parking/schemas/parking-facility.schema';
import { ParkingSnapshot, ParkingSnapshotSchema } from './parking/schemas/parking-snapshot.schema';
import { rebuildProjections } from './projections/rebuild-projections';

async function main() {
  await ConfigModule.forRoot();
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const result = await rebuildProjections({
      venues: mongoose.model(Venue.name, VenueSchema),
      views: mongoose.model(VenueMapView.name, VenueMapViewSchema),
      availabilitySnapshots: mongoose.model(AvailabilitySnapshot.name, AvailabilitySnapshotSchema),
      availabilityLatest: mongoose.model(AvailabilityLatest.name, AvailabilityLatestSchema),
      parking: mongoose.model(ParkingFacility.name, ParkingFacilitySchema),
      parkingSnapshots: mongoose.model(ParkingSnapshot.name, ParkingSnapshotSchema),
    });
    console.log('Rebuilt projections', result);
  } finally { await mongoose.disconnect(); }
}

void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
