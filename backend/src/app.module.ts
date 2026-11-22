import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { MapModule } from './map/map.module';
import { AvailabilityModule } from './availability/availability.module';
import { ParkingModule } from './parking/parking.module';
import { LiveModule } from './live/live.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { VenuesModule } from './venues/venues.module';
import { HealthController } from './health.controller';
import { CommunityModule } from './community/community.module';
import { BusinessModule } from './business/business.module';
import { BookingModule } from './booking/booking.module';
import { VoucherModule } from './voucher/voucher.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
        autoIndex: process.env.NODE_ENV !== 'production',
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 240 }]),
    LiveModule,
    AuthModule,
    MapModule,
    AvailabilityModule,
    ParkingModule,
    SubscriptionModule,
    VenuesModule,
    CommunityModule,
    BusinessModule,
    BookingModule,
    VoucherModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
  controllers: [HealthController],
})
export class AppModule {}
