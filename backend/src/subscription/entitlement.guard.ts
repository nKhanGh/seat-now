import { getSessionToken } from '../auth/session-token';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { AuthService } from '../auth/services/auth.service';
import { EntitlementKey } from './services/entitlement.service';
import { EntitlementService } from './services/entitlement.service';

export const ENTITLEMENT_KEY = 'seatnow.entitlement';

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService, private readonly entitlements: EntitlementService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const key = this.reflector.getAllAndOverride<EntitlementKey>(ENTITLEMENT_KEY, [context.getHandler(), context.getClass()]);
    if (!key) return true;
    const request = context.switchToHttp().getRequest<Request & { cookies?: Record<string, string> }>();
    const user = await this.auth.authenticate(getSessionToken(request));
    if (!await this.entitlements.can(user.id, key)) throw new ForbiddenException('Entitlement required');
    return true;
  }
}
