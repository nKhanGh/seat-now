import { Coordinates, distanceMeters } from './geo';
import { VenueMapItem } from './map.service';

export type VenueSort = 'distance' | 'rating' | 'price';

export function sortVenues(venues: VenueMapItem[], sort: VenueSort, center: Coordinates): VenueMapItem[] {
  const distance = (venue: VenueMapItem) => distanceMeters(center, venue.location.coordinates);
  return [...venues].sort((a, b) => {
    if (sort === 'rating' && a.rating !== b.rating) return b.rating - a.rating;
    if (sort === 'price' && a.priceTier !== b.priceTier) return a.priceTier - b.priceTier;
    if (sort === 'distance') {
      const sponsored = Number(Boolean(b.promotion?.sponsored)) - Number(Boolean(a.promotion?.sponsored));
      if (sponsored) return sponsored;
    }
    return distance(a) - distance(b) || a.slug.localeCompare(b.slug);
  });
}
