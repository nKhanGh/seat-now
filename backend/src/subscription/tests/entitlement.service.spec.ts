import { effectivePlan, entitlementKeys, resolveEntitlements } from '../services/entitlement.service';

const now = new Date('2026-11-19T10:00:00.000Z');
const active = {
  status: 'ACTIVE' as const,
  currentPeriodStart: new Date('2026-11-01T00:00:00.000Z'),
  currentPeriodEnd: new Date('2026-12-01T00:00:00.000Z'),
};

describe('user plan resolver', () => {
  it('defaults to free when no subscription exists', () => {
    expect(effectivePlan(null, now)).toBe('FREE');
    expect(resolveEntitlements('FREE')).toMatchObject({
      'map.basic': true,
      'parking.read': true,
      'booking.priority': false,
    });
  });

  it('grants premium only inside an active paid period', () => {
    expect(effectivePlan(active, now)).toBe('PREMIUM');
    expect(effectivePlan({ ...active, status: 'CANCELED' }, now)).toBe('PREMIUM');
    expect(effectivePlan({ ...active, status: 'PAST_DUE' }, now)).toBe('FREE');
    expect(effectivePlan(active, active.currentPeriodEnd)).toBe('FREE');
    expect(effectivePlan({ ...active, currentPeriodStart: new Date('2026-11-20T00:00:00.000Z') }, now)).toBe(
      'FREE',
    );
  });

  it('keeps the entitlement contract complete', () => {
    expect(Object.keys(resolveEntitlements('FREE')).sort()).toEqual([...entitlementKeys].sort());
    expect(Object.keys(resolveEntitlements('PREMIUM')).sort()).toEqual([...entitlementKeys].sort());
  });
});
