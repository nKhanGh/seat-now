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
import { ReviewReport, ReviewReportSchema } from './schemas/review-report.schema';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { FollowsService } from './services/follows.service';
import { FollowsController } from './controllers/follows.controller';
import { VenueProposal, VenueProposalSchema } from './schemas/venue-proposal.schema';
import { ProposalConfirmation, ProposalConfirmationSchema } from './schemas/proposal-confirmation.schema';
import { ProposalsService } from './services/proposals.service';
import { ProposalsController } from './controllers/proposals.controller';

@Module({
  imports: [
    AuthModule,
    VenuesModule,
    MongooseModule.forFeature([
      { name: CheckIn.name, schema: CheckInSchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: ReviewPhoto.name, schema: ReviewPhotoSchema },
      { name: ReviewReport.name, schema: ReviewReportSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: VenueProposal.name, schema: VenueProposalSchema },
      { name: ProposalConfirmation.name, schema: ProposalConfirmationSchema },
    ]),
  ],
  controllers: [
    CheckInController,
    FavoritesController,
    ReviewsController,
    FollowsController,
    ProposalsController,
  ],
  providers: [CheckInService, FavoritesService, ReviewsService, FollowsService, ProposalsService],
})
export class CommunityModule {}
