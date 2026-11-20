import { describe, expect, it } from 'vitest';
import { VenueMapItem } from './map.service';
import { nearbySuggestions } from './nearbySuggestions';

function venue(slug: string, lat: number, category: VenueMapItem['category'] = 'CAFE'): VenueMapItem {
  return {
    slug,
    category,
    location: { type: 'Point', coordinates: [106.7, lat] },
  } as VenueMapItem;
}

describe('nearby venue suggestions', () => {
  it('excludes the selected venue and places beyond 2 km, then sorts by actual distance', () => {
    const selected = venue('selected', 10.77);
    const result = nearbySuggestions(selected, [
      venue('far', 10.8),
      venue('second', 10.772),
      selected,
      venue('first', 10.771),
    ]);

    expect(result.map(({ venue: item }) => item.slug)).toEqual(['first', 'second']);
    expect(result[0].distanceM).toBeGreaterThan(100);
    expect(result[0].distanceM).toBeLessThan(120);
  });

  it('includes nearby types before filling the remaining slots by distance', () => {
    const selected = venue('selected', 10.77, 'RESTAURANT');
    const result = nearbySuggestions(selected, [
      venue('cafe-a', 10.7701),
      venue('cafe-b', 10.7702),
      venue('cafe-c', 10.7703),
      venue('cafe-d', 10.7704),
      venue('cinema', 10.771, 'CINEMA'),
      venue('restaurant', 10.7715, 'RESTAURANT'),
    ]);

    expect(result.map(({ venue: item }) => item.slug)).toEqual(['cafe-a', 'cafe-b', 'cinema', 'restaurant']);
  });
});
