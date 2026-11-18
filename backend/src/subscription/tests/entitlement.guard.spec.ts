import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../auth/services/auth.service';
import { EntitlementGuard } from '../entitlement.guard';
import { EntitlementService } from '../services/entitlement.service';

describe('EntitlementGuard', () => {
  const context = {
    getHandler: () => function protectedRoute() {},
    getClass: () => class TestController {},
    switchToHttp: () => ({ getRequest: () => ({ cookies: { seatnow_sid: 'test-session' } }) }),
  } as unknown as ExecutionContext;

  it('denies a protected capability when the server resolver returns false', async () => {
    const reflector = { getAllAndOverride: () => 'booking.priority' } as unknown as Reflector;
    const auth = { authenticate: jest.fn().mockResolvedValue({ id: 'user-1' }) } as unknown as AuthService;
    const entitlements = { can: jest.fn().mockResolvedValue(false) } as unknown as EntitlementService;
    const guard = new EntitlementGuard(reflector, auth, entitlements);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(entitlements.can).toHaveBeenCalledWith('user-1', 'booking.priority');
  });
});
