import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { SubscriptionController } from './controllers/subscription.controller';
import { EntitlementGuard } from './entitlement.guard';
import { EntitlementService } from './services/entitlement.service';
import { UserSubscription, UserSubscriptionSchema } from './schemas/user-subscription.schema';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { AdminSubscriptionService } from './services/admin-subscription.service';
import { AdminSubscriptionController } from './controllers/admin-subscription.controller';
import { RecommendationController } from './controllers/recommendation.controller';
import { RecommendationService } from './services/recommendation.service';
import { VenueMapView, VenueMapViewSchema } from '../map/schemas/venue-map-view.schema';
import { Favorite, FavoriteSchema } from '../community/schemas/favorite.schema';
import { Review, ReviewSchema } from '../community/schemas/review.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: UserSubscription.name, schema: UserSubscriptionSchema },
      { name: User.name, schema: UserSchema },
      { name: VenueMapView.name, schema: VenueMapViewSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [SubscriptionController, AdminSubscriptionController, RecommendationController],
  providers: [EntitlementService, EntitlementGuard, AdminSubscriptionService, RecommendationService],
  exports: [EntitlementService, EntitlementGuard],
})
export class SubscriptionModule {}
