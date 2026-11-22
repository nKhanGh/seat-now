import { describe, expect, it } from 'vitest';
import { venuesWithinRadius } from './geo';

const venues = [
  { slug: 'near', location: { coordinates: [106.7009, 10.7769] as [number, number] } },
  { slug: 'far', location: { coordinates: [106.7189, 10.7769] as [number, number] } },
];

describe('venuesWithinRadius', () => {
  it('updates visible places when the radius or map center changes', () => {
    expect(venuesWithinRadius(venues, [106.7009, 10.7769], 1000).map((venue) => venue.slug)).toEqual([
      'near',
    ]);
    expect(venuesWithinRadius(venues, [106.7009, 10.7769], 3000).map((venue) => venue.slug)).toEqual([
      'near',
      'far',
    ]);
    expect(venuesWithinRadius(venues, [106.7189, 10.7769], 1000).map((venue) => venue.slug)).toEqual(['far']);
  });
});
