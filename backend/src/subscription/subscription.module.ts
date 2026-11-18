import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionController } from './controllers/subscription.controller';
import { EntitlementGuard } from './entitlement.guard';
import { EntitlementService } from './services/entitlement.service';
import { UserSubscription, UserSubscriptionSchema } from './schemas/user-subscription.schema';

@Module({
  imports: [AuthModule, MongooseModule.forFeature([{ name: UserSubscription.name, schema: UserSubscriptionSchema }])],
  controllers: [SubscriptionController],
  providers: [EntitlementService, EntitlementGuard],
  exports: [EntitlementService, EntitlementGuard],
})
export class SubscriptionModule {}
