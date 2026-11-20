import { describe, expect, it } from 'vitest';
import { VenueMapItem } from './map.service';
import { sortVenues } from './sortVenues';

function venue(slug: string, lat: number, rating: number, priceTier: number, sponsored = false) {
  return {
    slug,
    location: { type: 'Point', coordinates: [106.7, lat] },
    rating,
    priceTier,
    promotion: sponsored ? { sponsored: true } : null,
  } as VenueMapItem;
}

describe('sortVenues', () => {
  const venues = [
    venue('cheap', 10.771, 3.5, 1),
    venue('top-rated', 10.773, 4.9, 3),
    venue('sponsored', 10.775, 4.0, 2, true),
  ];

  it('sorts by current center while keeping sponsored places first by default', () => {
    expect(sortVenues(venues, 'distance', [106.7, 10.77]).map((item) => item.slug)).toEqual([
      'sponsored',
      'cheap',
      'top-rated',
    ]);
    expect(sortVenues(venues, 'distance', [106.7, 10.774]).map((item) => item.slug)).toEqual([
      'sponsored',
      'top-rated',
      'cheap',
    ]);
  });

  it('applies explicit rating and price order before distance', () => {
    expect(sortVenues(venues, 'rating', [106.7, 10.77]).map((item) => item.slug)).toEqual([
      'top-rated',
      'sponsored',
      'cheap',
    ]);
    expect(sortVenues(venues, 'price', [106.7, 10.77]).map((item) => item.slug)).toEqual([
      'cheap',
      'sponsored',
      'top-rated',
    ]);
  });
});
