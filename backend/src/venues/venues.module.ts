import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AvailabilityModule } from '../availability/availability.module';
import { Venue, VenueSchema } from '../map/schemas/venue.schema';
import { VenuesController } from './controllers/venues.controller';
import { VenuesService } from './services/venues.service';

@Module({
  imports: [AvailabilityModule, MongooseModule.forFeature([{ name: Venue.name, schema: VenueSchema }])],
  controllers: [VenuesController],
  providers: [VenuesService],
  exports: [VenuesService],
})
export class VenuesModule {}
