import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { EntitlementService } from '../services/entitlement.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('me')
export class SubscriptionController {
  constructor(private readonly auth: AuthService, private readonly entitlements: EntitlementService) {}

  private async userId(request: CookieRequest) {
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-seatnow_sid' : 'seatnow_sid';
    return (await this.auth.authenticate(request.cookies?.[cookieName])).id;
  }

  @Get('subscription')
  async subscription(@Req() request: CookieRequest) {
    return { data: await this.entitlements.state(await this.userId(request)) };
  }

  @Get('entitlements')
  async userEntitlements(@Req() request: CookieRequest) {
    return { data: await this.entitlements.entitlements(await this.userId(request)) };
  }
}
