import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';
import { SubscriptionModule } from '../subscription/subscription.module';
import { Venue, VenueSchema } from '../map/schemas/venue.schema';
import { BookingController } from './controllers/booking.controller';
import { Booking, BookingSchema } from './schemas/booking.schema';
import { BookingService } from './services/booking.service';

@Module({
  imports: [
    AuthModule,
    BusinessModule,
    SubscriptionModule,
    MongooseModule.forFeature([
      { name: Booking.name, schema: BookingSchema },
      { name: Venue.name, schema: VenueSchema },
    ]),
  ],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
