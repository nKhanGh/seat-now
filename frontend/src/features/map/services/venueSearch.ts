import { VenueMapItem } from './map.service';

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLocaleLowerCase('vi-VN')
    .trim();
}

export function searchVenues(venues: VenueMapItem[], query: string) {
  const needle = normalizeSearchText(query);
  if (!needle) return venues;
  return venues
    .filter((venue) =>
      [venue.name, venue.address].some((field) => normalizeSearchText(field).includes(needle)),
    )
    .sort((a, b) => {
      const aName = normalizeSearchText(a.name);
      const bName = normalizeSearchText(b.name);
      const rank = (name: string) => (name.startsWith(needle) ? 0 : name.includes(needle) ? 1 : 2);
      return rank(aName) - rank(bName) || a.name.localeCompare(b.name, 'vi');
    });
}
