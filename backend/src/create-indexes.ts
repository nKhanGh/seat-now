import 'reflect-metadata';
import { ConfigModule } from '@nestjs/config';
import mongoose from 'mongoose';
import { User, UserSchema } from './auth/schemas/user.schema';
import { Session, SessionSchema } from './auth/schemas/session.schema';
import { VenueMapView, VenueMapViewSchema } from './map/schemas/venue-map-view.schema';
import { Venue, VenueSchema } from './map/schemas/venue.schema';
import {
  AvailabilityLatest,
  AvailabilityLatestSchema,
  AvailabilitySnapshot,
  AvailabilitySnapshotSchema,
} from './availability/schemas/availability-snapshot.schema';
import { ParkingFacility, ParkingFacilitySchema } from './parking/schemas/parking-facility.schema';
import { ParkingSnapshot, ParkingSnapshotSchema } from './parking/schemas/parking-snapshot.schema';
import { UserSubscription, UserSubscriptionSchema } from './subscription/schemas/user-subscription.schema';
import { CheckIn, CheckInSchema } from './community/schemas/check-in.schema';
import { Favorite, FavoriteSchema } from './community/schemas/favorite.schema';
import { Review, ReviewSchema } from './community/schemas/review.schema';
import { ReviewPhoto, ReviewPhotoSchema } from './community/schemas/review-photo.schema';
import { ReviewReport, ReviewReportSchema } from './community/schemas/review-report.schema';
import { Follow, FollowSchema } from './community/schemas/follow.schema';
import { VenueProposal, VenueProposalSchema } from './community/schemas/venue-proposal.schema';
import {
  ProposalConfirmation,
  ProposalConfirmationSchema,
} from './community/schemas/proposal-confirmation.schema';
import { BusinessClaim, BusinessClaimSchema } from './business/schemas/business-claim.schema';
import { BusinessAccess, BusinessAccessSchema } from './business/schemas/business-access.schema';
import { VenueLogo, VenueLogoSchema } from './venues/schemas/venue-logo.schema';
import { VenuePageView, VenuePageViewSchema } from './venues/schemas/venue-page-view.schema';
import { VenueCover, VenueCoverSchema } from './venues/schemas/venue-cover.schema';

async function createIndexes() {
  await ConfigModule.forRoot();
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is required');
  await mongoose.connect(uri);
  try {
    await mongoose.model(User.name, UserSchema).createIndexes();
    await mongoose.model(Session.name, SessionSchema).createIndexes();
    await mongoose.model(VenueMapView.name, VenueMapViewSchema).createIndexes();
    await mongoose.model(Venue.name, VenueSchema).createIndexes();
    await mongoose.model(AvailabilitySnapshot.name, AvailabilitySnapshotSchema).createIndexes();
    await mongoose.model(AvailabilityLatest.name, AvailabilityLatestSchema).createIndexes();
    await mongoose.model(ParkingFacility.name, ParkingFacilitySchema).createIndexes();
    await mongoose.model(ParkingSnapshot.name, ParkingSnapshotSchema).createIndexes();
    await mongoose.model(UserSubscription.name, UserSubscriptionSchema).createIndexes();
    await mongoose.model(CheckIn.name, CheckInSchema).createIndexes();
    await mongoose.model(Favorite.name, FavoriteSchema).createIndexes();
    await mongoose.model(Review.name, ReviewSchema).createIndexes();
    await mongoose.model(ReviewPhoto.name, ReviewPhotoSchema).createIndexes();
    await mongoose.model(ReviewReport.name, ReviewReportSchema).createIndexes();
    await mongoose.model(Follow.name, FollowSchema).createIndexes();
    await mongoose.model(VenueProposal.name, VenueProposalSchema).createIndexes();
    await mongoose.model(ProposalConfirmation.name, ProposalConfirmationSchema).createIndexes();
    await mongoose.model(BusinessClaim.name, BusinessClaimSchema).createIndexes();
    await mongoose.model(BusinessAccess.name, BusinessAccessSchema).createIndexes();
    await mongoose.model(VenueLogo.name, VenueLogoSchema).createIndexes();
    await mongoose.model(VenuePageView.name, VenuePageViewSchema).createIndexes();
    await mongoose.model(VenueCover.name, VenueCoverSchema).createIndexes();
  } finally {
    await mongoose.disconnect();
  }
}

void createIndexes().catch((error: unknown) => {
  console.error('Failed to create MongoDB indexes', error);
  process.exitCode = 1;
});
