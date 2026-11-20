import { describe, expect, it } from 'vitest';
import { VenueMapItem } from './map.service';
import { nearbySuggestions } from './nearbySuggestions';

function venue(slug: string, lat: number): VenueMapItem {
  return {
    slug,
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
});
