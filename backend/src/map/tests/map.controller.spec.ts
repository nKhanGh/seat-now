import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { EntitlementService } from '../../subscription/services/entitlement.service';
import { MapController } from '../controllers/map.controller';
import { MapService } from '../services/map.service';

describe('MapController ad-free access', () => {
  const query = { lat: 10.77, lng: 106.7, radiusM: 3000, limit: 20 };
  const request = { cookies: { seatnow_sid: 'test-session' } } as unknown as Request;
  const mapService = { findNearby: jest.fn().mockResolvedValue({ data: [] }) };
  const auth = { authenticate: jest.fn().mockResolvedValue({ id: 'user-1' }) };
  const entitlements = { can: jest.fn() };
  const controller = new MapController(
    mapService as unknown as MapService,
    auth as unknown as AuthService,
    entitlements as unknown as EntitlementService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('keeps public map access and rejects forged ad-free requests', async () => {
    await controller.findNearby(query, request);
    expect(auth.authenticate).not.toHaveBeenCalled();
    expect(mapService.findNearby).toHaveBeenCalledWith(query);

    auth.authenticate.mockRejectedValueOnce(new UnauthorizedException());
    await expect(controller.findNearby({ ...query, adsHidden: 'true' }, request)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(mapService.findNearby).toHaveBeenCalledTimes(1);

    entitlements.can.mockResolvedValueOnce(false);
    await expect(controller.findNearby({ ...query, adsHidden: 'true' }, request)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mapService.findNearby).toHaveBeenCalledTimes(1);
    expect(auth.authenticate).toHaveBeenCalledWith('test-session');
    expect(entitlements.can).toHaveBeenCalledWith('user-1', 'ads.hidden');

    entitlements.can.mockResolvedValueOnce(true);
    await controller.findNearby({ ...query, adsHidden: 'true' }, request);
    expect(mapService.findNearby).toHaveBeenLastCalledWith({ ...query, adsHidden: 'true' }, true);
  });
});
