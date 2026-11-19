import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { VenuesModule } from '../venues/venues.module';
import { CheckInController } from './controllers/check-in.controller';
import { CheckIn, CheckInSchema } from './schemas/check-in.schema';
import { CheckInService } from './services/check-in.service';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { FavoritesService } from './services/favorites.service';
import { FavoritesController } from './controllers/favorites.controller';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewsService } from './services/reviews.service';
import { ReviewsController } from './controllers/reviews.controller';
import { ReviewPhoto, ReviewPhotoSchema } from './schemas/review-photo.schema';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { FollowsService } from './services/follows.service';
import { FollowsController } from './controllers/follows.controller';

@Module({
  imports: [AuthModule, VenuesModule, MongooseModule.forFeature([
    { name: CheckIn.name, schema: CheckInSchema },
    { name: Favorite.name, schema: FavoriteSchema },
    { name: Review.name, schema: ReviewSchema },
    { name: ReviewPhoto.name, schema: ReviewPhotoSchema },
    { name: Follow.name, schema: FollowSchema },
  ])],
  controllers: [CheckInController, FavoritesController, ReviewsController, FollowsController],
  providers: [CheckInService, FavoritesService, ReviewsService, FollowsService],
})
export class CommunityModule {}
