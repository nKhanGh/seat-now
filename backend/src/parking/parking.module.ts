import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParkingController } from './controllers/parking.controller';
import { ParkingFacility, ParkingFacilitySchema } from './schemas/parking-facility.schema';
import { ParkingSnapshot, ParkingSnapshotSchema } from './schemas/parking-snapshot.schema';
import { ParkingService } from './services/parking.service';
import { VenueMapView, VenueMapViewSchema } from '../map/schemas/venue-map-view.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ParkingFacility.name, schema: ParkingFacilitySchema },
      { name: ParkingSnapshot.name, schema: ParkingSnapshotSchema },
      { name: VenueMapView.name, schema: VenueMapViewSchema },
    ]),
  ],
  controllers: [ParkingController],
  providers: [ParkingService],
})
export class ParkingModule {}
