import { getSessionToken } from '../../auth/session-token';
import { Body, Controller, ForbiddenException, Get, Post, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { AdminSubscriptionService } from '../services/admin-subscription.service';
import { GrantDemoPremiumDto } from '../dto/grant-demo-premium.dto';
import { RevokeDemoPremiumDto } from '../dto/revoke-demo-premium.dto';
import { AdminUsersQueryDto } from '../dto/admin-users-query.dto';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('admin/subscriptions/demo')
export class AdminSubscriptionController {
  constructor(
    private readonly auth: AuthService,
    private readonly subscriptions: AdminSubscriptionService,
  ) {}

  private async requireAdmin(request: CookieRequest) {
    const user = await this.auth.authenticate(getSessionToken(request));
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
  }

  @Get('users')
  async users(@Req() request: CookieRequest, @Query() query: AdminUsersQueryDto) {
    await this.requireAdmin(request);
    return this.subscriptions.listUsers(query);
  }

  @Post('grant')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async grant(@Req() request: CookieRequest, @Body() input: GrantDemoPremiumDto) {
    await this.requireAdmin(request);
    return this.subscriptions.grant(input.email, input.days);
  }

  @Post('revoke')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async revoke(@Req() request: CookieRequest, @Body() input: RevokeDemoPremiumDto) {
    await this.requireAdmin(request);
    return this.subscriptions.revoke(input.email);
  }
}
