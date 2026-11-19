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

@Module({
  imports: [AuthModule, VenuesModule, MongooseModule.forFeature([
    { name: CheckIn.name, schema: CheckInSchema },
    { name: Favorite.name, schema: FavoriteSchema },
    { name: Review.name, schema: ReviewSchema },
    { name: ReviewPhoto.name, schema: ReviewPhotoSchema },
  ])],
  controllers: [CheckInController, FavoritesController, ReviewsController],
  providers: [CheckInService, FavoritesService, ReviewsService],
})
export class CommunityModule {}
