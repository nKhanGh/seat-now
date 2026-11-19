import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { VenuesModule } from '../venues/venues.module';
import { CheckInController } from './controllers/check-in.controller';
import { CheckIn, CheckInSchema } from './schemas/check-in.schema';
import { CheckInService } from './services/check-in.service';

@Module({
  imports: [AuthModule, VenuesModule, MongooseModule.forFeature([{ name: CheckIn.name, schema: CheckInSchema }])],
  controllers: [CheckInController],
  providers: [CheckInService],
})
export class CommunityModule {}
