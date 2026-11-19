import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvailabilityController } from './controllers/availability.controller';
import { AvailabilityLatest, AvailabilityLatestSchema, AvailabilitySnapshot, AvailabilitySnapshotSchema } from './schemas/availability-snapshot.schema';
import { AvailabilityService } from './services/availability.service';
import { VenueMapView, VenueMapViewSchema } from '../map/schemas/venue-map-view.schema';

@Module({
  imports: [MongooseModule.forFeature([
    { name: AvailabilitySnapshot.name, schema: AvailabilitySnapshotSchema },
    { name: AvailabilityLatest.name, schema: AvailabilityLatestSchema },
    { name: VenueMapView.name, schema: VenueMapViewSchema },
  ])],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService],
})
export class AvailabilityModule {}
