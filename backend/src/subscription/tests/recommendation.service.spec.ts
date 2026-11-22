import { RecommendationQueryDto } from '../dto/recommendation-query.dto';
import { scoreRecommendation } from '../services/recommendation.service';

const query: RecommendationQueryDto = {
  lat: 10.7769,
  lng: 106.7009,
  cuisine: 'VIETNAMESE',
  maxPriceTier: 2,
  partySize: 2,
};

const candidate = {
  slug: 'test-venue',
  cuisineTypes: ['VIETNAMESE'],
  rating: 4.7,
  priceTier: 2,
  distanceM: 800,
  availabilityExpiresAt: new Date('2026-11-22T12:10:00Z'),
  acceptingGuests: true,
  seatsAvailable: 4,
  tablesAvailable: 2,
} as Parameters<typeof scoreRecommendation>[0];

describe('Premium recommendation ranking', () => {
  const now = new Date('2026-11-22T12:00:00Z');

  it('rewards a matching cuisine, budget and fresh available seats', () => {
    const result = scoreRecommendation(candidate, query, new Set(), new Set(), now);
    expect(result.reasons).toContain('Đúng loại món bạn chọn');
    expect(result.reasons).toContain('Trong mức giá bạn chọn');
    expect(result.reasons).toContain('Hiện còn chỗ theo dữ liệu gần nhất');
  });

  it('does not present expired availability as current or reward an over-budget venue', () => {
    const stale = scoreRecommendation(
      { ...candidate, availabilityExpiresAt: new Date('2026-11-22T11:00:00Z'), priceTier: 4 },
      query,
      new Set(),
      new Set(),
      now,
    );
    const fresh = scoreRecommendation(candidate, query, new Set(), new Set(), now);
    expect(stale.reasons).not.toContain('Hiện còn chỗ theo dữ liệu gần nhất');
    expect(stale.score).toBeLessThan(fresh.score);
  });
});
