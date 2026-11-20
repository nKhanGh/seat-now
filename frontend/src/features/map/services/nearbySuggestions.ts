import { VenueMapItem } from './map.service';

export type NearbySuggestion = { venue: VenueMapItem; distanceM: number };

function distanceMeters(a: VenueMapItem, b: VenueMapItem) {
  const [lngA, latA] = a.location.coordinates;
  const [lngB, latB] = b.location.coordinates;
  const toRadians = Math.PI / 180;
  const latitudeDelta = (latB - latA) * toRadians;
  const longitudeDelta = (lngB - lngA) * toRadians;
  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latA * toRadians) * Math.cos(latB * toRadians) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(6_371_000 * 2 * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc)));
}

export function nearbySuggestions(selected: VenueMapItem, venues: VenueMapItem[]): NearbySuggestion[] {
  const candidates = venues
    .filter((venue) => venue.slug !== selected.slug)
    .map((venue) => ({ venue, distanceM: distanceMeters(selected, venue) }))
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
