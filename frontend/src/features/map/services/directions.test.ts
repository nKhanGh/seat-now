import { describe, expect, it } from 'vitest';
import { directionsUrl } from './directions';

describe('directionsUrl', () => {
  it('opens the selected destination without guessing the user location', () => {
    const url = new URL(directionsUrl([106.7009, 10.7769])!);
    expect(url.origin).toBe('https://www.google.com');
    expect(url.searchParams.get('destination')).toBe('10.7769,106.7009');
    expect(url.searchParams.has('origin')).toBe(false);
  });

  it('uses a known user location as the route origin', () => {
    const url = new URL(directionsUrl([106.7, 10.77], [106.71, 10.78])!);
    expect(url.searchParams.get('origin')).toBe('10.78,106.71');
  });

  it('rejects invalid destinations and ignores invalid origins', () => {
    expect(directionsUrl([Infinity, 10])).toBeNull();
    expect(directionsUrl([106, 91])).toBeNull();
    expect(new URL(directionsUrl([106, 10], [NaN, 10])!).searchParams.has('origin')).toBe(false);
  });
});
