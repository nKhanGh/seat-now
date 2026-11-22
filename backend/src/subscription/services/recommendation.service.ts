import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite } from '../../community/schemas/favorite.schema';
import { Review } from '../../community/schemas/review.schema';
import { VenueMapView } from '../../map/schemas/venue-map-view.schema';
import { RecommendationQueryDto } from '../dto/recommendation-query.dto';

type Candidate = VenueMapView & { distanceM: number };

export function scoreRecommendation(
  venue: Candidate,
  query: RecommendationQueryDto,
  favoriteSlugs: Set<string>,
  preferredCuisines: Set<string>,
  now: Date,
) {
  const reasons: string[] = [];
  let score = Math.max(0, 20 - venue.distanceM / 1000) + venue.rating * 6;
  if (query.cuisine && venue.cuisineTypes.includes(query.cuisine)) {
    score += 18;
    reasons.push('Đúng loại món bạn chọn');
  } else if (venue.cuisineTypes.some((type) => preferredCuisines.has(type))) {
    score += 10;
    reasons.push('Hợp với quán bạn từng lưu hoặc đánh giá cao');
  }
  if (query.maxPriceTier) {
    if (venue.priceTier <= query.maxPriceTier) {
      score += 10;
      reasons.push('Trong mức giá bạn chọn');
    } else score -= (venue.priceTier - query.maxPriceTier) * 15;
  }
  if (favoriteSlugs.has(venue.slug)) {
    score += 5;
    reasons.push('Bạn đã lưu quán này');
  }
  const fresh = venue.availabilityExpiresAt && venue.availabilityExpiresAt > now;
  const spaces = venue.seatsAvailable ?? venue.tablesAvailable;
  if (fresh && venue.acceptingGuests && spaces !== null && spaces !== undefined) {
    if (spaces >= (query.partySize ?? 1)) {
      score += 12;
      reasons.push('Hiện còn chỗ theo dữ liệu gần nhất');
    } else score -= 20;
  }
  if (venue.distanceM < 3000) reasons.push('Gần khu vực bạn chọn');
  if (venue.rating >= 4.5) reasons.push('Được đánh giá cao');
  return { score, reasons: reasons.slice(0, 3) };
}

@Injectable()
export class RecommendationService {
  constructor(
    @InjectModel(VenueMapView.name) private readonly venues: Model<VenueMapView>,
    @InjectModel(Favorite.name) private readonly favorites: Model<Favorite>,
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
  ) {}

  async recommend(userId: string, query: RecommendationQueryDto) {
    const userObjectId = new Types.ObjectId(userId);
    const [candidates, favorites, reviews] = await Promise.all([
      this.venues.aggregate<Candidate>([
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [query.lng, query.lat] },
            distanceField: 'distanceM',
            maxDistance: 20_000,
            spherical: true,
            query: { status: 'ACTIVE' },
          },
        },
        { $limit: 120 },
      ]),
      this.favorites.find({ userId: userObjectId }).sort({ createdAt: -1 }).limit(30).lean(),
      this.reviews.find({ userId: userObjectId, status: 'PUBLISHED' }).limit(30).lean(),
    ]);
    const favoriteSlugs = new Set(favorites.map((item) => item.venueSlug));
    const likedSlugs = new Set(reviews.filter((item) => item.rating >= 4).map((item) => item.venueSlug));
    const dislikedSlugs = new Set(reviews.filter((item) => item.rating <= 2).map((item) => item.venueSlug));
    const preferredCuisines = new Set(
      candidates
        .filter((venue) => favoriteSlugs.has(venue.slug) || likedSlugs.has(venue.slug))
        .flatMap((venue) => venue.cuisineTypes),
    );
    const now = new Date();
    const ranked = candidates
      .filter((venue) => !dislikedSlugs.has(venue.slug))
      .map((venue) => ({
        venue,
        ...scoreRecommendation(venue, query, favoriteSlugs, preferredCuisines, now),
      }))
      .sort((left, right) => right.score - left.score || left.venue.distanceM - right.venue.distanceM)
      .slice(0, 6);
    return {
      data: ranked.map(({ venue, reasons }) => ({
        slug: venue.slug,
        name: venue.name,
        address: venue.address,
        category: venue.category,
        cuisineTypes: venue.cuisineTypes,
        rating: venue.rating,
        priceTier: venue.priceTier,
        distanceM: Math.round(venue.distanceM),
        reasons,
      })),
      meta: { method: 'RULE_BASED', radiusM: 20_000, basedOnHistory: preferredCuisines.size > 0 },
    };
  }
}
