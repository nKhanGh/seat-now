import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MapController } from './controllers/map.controller';
import { VenueMapView, VenueMapViewSchema } from './schemas/venue-map-view.schema';
import { MapService } from './services/map.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: VenueMapView.name, schema: VenueMapViewSchema }])],
  controllers: [MapController],
  providers: [MapService],
})
export class MapModule {}
