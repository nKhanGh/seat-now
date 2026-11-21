import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MapController } from './controllers/map.controller';
import { VenueMapView, VenueMapViewSchema } from './schemas/venue-map-view.schema';
import { MapService } from './services/map.service';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionModule } from '../subscription/subscription.module';

@Module({
  imports: [
    AuthModule,
    SubscriptionModule,
    MongooseModule.forFeature([{ name: VenueMapView.name, schema: VenueMapViewSchema }]),
  ],
  controllers: [MapController],
  providers: [MapService],
})
export class MapModule {}
