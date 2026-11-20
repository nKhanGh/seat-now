import { VenueMapItem } from './map.service';
import { distanceMeters } from './geo';

export type NearbySuggestion = { venue: VenueMapItem; distanceM: number };

export function nearbySuggestions(selected: VenueMapItem, venues: VenueMapItem[]): NearbySuggestion[] {
  const candidates = venues
    .filter((venue) => venue.slug !== selected.slug)
    .map((venue) => ({
      venue,
      distanceM: distanceMeters(selected.location.coordinates, venue.location.coordinates),
    }))
    .filter(({ distanceM }) => distanceM <= 2_000)
    .sort((a, b) => a.distanceM - b.distanceM || a.venue.slug.localeCompare(b.venue.slug));
  const chosen: NearbySuggestion[] = [];
  const categories = new Set<VenueMapItem['category']>();
  for (const candidate of candidates) {
    if (categories.has(candidate.venue.category)) continue;
    chosen.push(candidate);
    categories.add(candidate.venue.category);
    if (chosen.length === 4) break;
  }
  for (const candidate of candidates) {
    if (chosen.length === 4) break;
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen.sort((a, b) => a.distanceM - b.distanceM || a.venue.slug.localeCompare(b.venue.slug));
}
