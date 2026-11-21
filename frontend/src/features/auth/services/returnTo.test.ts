import { describe, expect, it } from 'vitest';
import { safeReturnTo } from './returnTo';

describe('safeReturnTo', () => {
  it('keeps an internal venue and its filters', () => {
    expect(safeReturnTo('/?lat=10.77&venue=demo-hcm-001')).toBe('/?lat=10.77&venue=demo-hcm-001');
    expect(safeReturnTo('/favorites#saved')).toBe('/favorites#saved');
  });

  it('rejects external and authentication destinations', () => {
    for (const value of [
      'https://example.com',
      '//example.com',
      '/\\example.com',
      '/login',
      '/register',
      null,
    ]) {
      expect(safeReturnTo(value)).toBe('/');
    }
  });
});
