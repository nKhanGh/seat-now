import { ForbiddenException } from '@nestjs/common';
import { AuthService } from '../../auth/services/auth.service';
import { BusinessAccessController } from '../controllers/business-access.controller';
import { BusinessAccessService } from '../services/business-access.service';

describe('BusinessAccessController admin authorization', () => {
  const request = { cookies: { seatnow_sid: 'session-token' } } as unknown as Parameters<
    BusinessAccessController['adminPendingClaims']
  >[0];
  const pendingClaims = jest.fn().mockResolvedValue({ data: [] });
  const approveClaim = jest.fn().mockResolvedValue({ data: { status: 'APPROVED' } });
  const business = { pendingClaims, approveClaim } as unknown as BusinessAccessService;
  const authenticate = jest.fn();
  const auth = { authenticate } as unknown as AuthService;
  const controller = new BusinessAccessController(business, auth);

  beforeEach(() => jest.clearAllMocks());

  it('rejects an ordinary signed-in user before reading or approving claims', async () => {
    authenticate.mockResolvedValue({ id: 'user', role: 'USER' });
    await expect(controller.adminPendingClaims(request)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(controller.adminApproveClaim(request, 'claim-id')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(pendingClaims).not.toHaveBeenCalled();
    expect(approveClaim).not.toHaveBeenCalled();
  });

  it('uses the authenticated admin session for the queue and decision', async () => {
    authenticate.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
    await expect(controller.adminPendingClaims(request)).resolves.toEqual({ data: [] });
    await expect(controller.adminApproveClaim(request, 'claim-id')).resolves.toEqual({
      data: { status: 'APPROVED' },
    });
    expect(authenticate).toHaveBeenCalledWith('session-token');
    expect(pendingClaims).toHaveBeenCalledTimes(1);
    expect(approveClaim).toHaveBeenCalledWith('claim-id');
  });
});
