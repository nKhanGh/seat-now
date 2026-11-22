import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BusinessModule } from '../business/business.module';
import { Venue, VenueSchema } from '../map/schemas/venue.schema';
import { SubscriptionModule } from '../subscription/subscription.module';
import { VoucherController } from './controllers/voucher.controller';
import { VoucherClaim, VoucherClaimSchema } from './schemas/voucher-claim.schema';
import { VoucherOffer, VoucherOfferSchema } from './schemas/voucher-offer.schema';
import { VoucherService } from './services/voucher.service';

@Module({
  imports: [
    AuthModule,
    BusinessModule,
    SubscriptionModule,
    MongooseModule.forFeature([
      { name: Venue.name, schema: VenueSchema },
      { name: VoucherOffer.name, schema: VoucherOfferSchema },
      { name: VoucherClaim.name, schema: VoucherClaimSchema },
    ]),
  ],
  controllers: [VoucherController],
  providers: [VoucherService],
})
export class VoucherModule {}
