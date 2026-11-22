import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ParkingController } from './controllers/parking.controller';
import { ParkingFacility, ParkingFacilitySchema } from './schemas/parking-facility.schema';
import { ParkingSnapshot, ParkingSnapshotSchema } from './schemas/parking-snapshot.schema';
import { ParkingService } from './services/parking.service';
import { VenueMapView, VenueMapViewSchema } from '../map/schemas/venue-map-view.schema';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { ParkingReservation, ParkingReservationSchema } from './schemas/parking-reservation.schema';
import { ParkingReservationController } from './controllers/parking-reservation.controller';
import { ParkingReservationService } from './services/parking-reservation.service';

@Module({
  imports: [
    AuthModule,
    BusinessModule,
    SubscriptionModule,
    MongooseModule.forFeature([
      { name: ParkingFacility.name, schema: ParkingFacilitySchema },
      { name: ParkingSnapshot.name, schema: ParkingSnapshotSchema },
      { name: VenueMapView.name, schema: VenueMapViewSchema },
      { name: ParkingReservation.name, schema: ParkingReservationSchema },
    ]),
  ],
  controllers: [ParkingController, ParkingReservationController],
  providers: [ParkingService, ParkingReservationService],
})
export class ParkingModule {}
