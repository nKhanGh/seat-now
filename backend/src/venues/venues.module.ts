import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvailabilityModule } from '../availability/availability.module';
import { Venue, VenueSchema } from '../map/schemas/venue.schema';
import { VenueMapView, VenueMapViewSchema } from '../map/schemas/venue-map-view.schema';
import { VenuesController } from './controllers/venues.controller';
import { VenuesService } from './services/venues.service';
import { VenueLogo, VenueLogoSchema } from './schemas/venue-logo.schema';
import { VenueLogoService } from './services/venue-logo.service';

@Module({
  imports: [AvailabilityModule, MongooseModule.forFeature([
    { name: Venue.name, schema: VenueSchema },
    { name: VenueMapView.name, schema: VenueMapViewSchema },
    { name: VenueLogo.name, schema: VenueLogoSchema },
  ])],
  controllers: [VenuesController],
  providers: [VenuesService, VenueLogoService],
  exports: [VenuesService, VenueLogoService],
})
export class VenuesModule {}
