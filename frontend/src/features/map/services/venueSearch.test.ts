import { describe, expect, it } from 'vitest';
import { VenueMapItem } from './map.service';
import { searchVenues } from './venueSearch';

const venue = (name: string, address: string) => ({ name, address }) as VenueMapItem;

describe('searchVenues', () => {
  const places = [
    venue('Cà phê Thảo Điền', 'Thủ Đức, TP.HCM'),
    venue('Quán ăn Bến Thành', 'Quận 1, TP.HCM'),
    venue('Rạp phim Lê Lợi', 'Bến Thành, Quận 1'),
  ];

  it('finds Vietnamese names and addresses without requiring accent marks', () => {
    expect(searchVenues(places, 'thao dien').map((item) => item.name)).toEqual(['Cà phê Thảo Điền']);
    expect(searchVenues(places, 'ben thanh').map((item) => item.name)).toEqual([
      'Quán ăn Bến Thành',
      'Rạp phim Lê Lợi',
    ]);
  });

  it('keeps all venues when the query is blank', () => {
    expect(searchVenues(places, '  ')).toBe(places);
  });
});
