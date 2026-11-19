import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { VenuesModule } from '../venues/venues.module';
import { BusinessAccessController } from './controllers/business-access.controller';
import { BusinessProfileController } from './controllers/business-profile.controller';
import { BusinessAccess, BusinessAccessSchema } from './schemas/business-access.schema';
import { BusinessClaim, BusinessClaimSchema } from './schemas/business-claim.schema';
import { BusinessAccessService } from './services/business-access.service';

@Module({
  imports: [AuthModule, VenuesModule, MongooseModule.forFeature([
    { name: BusinessClaim.name, schema: BusinessClaimSchema },
    { name: BusinessAccess.name, schema: BusinessAccessSchema },
  ])],
  controllers: [BusinessAccessController, BusinessProfileController],
  providers: [BusinessAccessService],
  exports: [BusinessAccessService],
})
export class BusinessModule {}
