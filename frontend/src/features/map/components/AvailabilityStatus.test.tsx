import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AvailabilityStatus } from './AvailabilityStatus';
import { VenueMapItem } from '../services/map.service';

const base: VenueMapItem['availability'] = {
  crowdLevel: 'QUIET', tablesAvailable: 4, tablesTotal: 10,
  seatsAvailable: null, seatsTotal: null, estimatedWaitMinutes: 0,
  acceptingGuests: true, source: 'DEMO', confidence: 0.8, version: 1,
  capturedAt: '2026-11-19T00:00:00.000Z', expiresAt: '2026-11-19T00:05:00.000Z',
  freshness: 'FRESH',
};

describe('availability presentation', () => {
  it('never presents an expired count as live availability', () => {
    const html = renderToStaticMarkup(<AvailabilityStatus availability={{ ...base, freshness: 'STALE' }} />);
    expect(html).toContain('Dữ liệu chỗ ngồi đã cũ');
    expect(html).toContain('Lần cuối ghi nhận');
    expect(html).not.toContain('Hiện ghi nhận');
  });

  it('shows unknown data without inventing zero free places', () => {
    const html = renderToStaticMarkup(<AvailabilityStatus availability={{ ...base, freshness: 'UNKNOWN', tablesAvailable: null, tablesTotal: null }} />);
    expect(html).toContain('Chưa có dữ liệu chỗ ngồi');
    expect(html).not.toContain('0/');
  });
});
