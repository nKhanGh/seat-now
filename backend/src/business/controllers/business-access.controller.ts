import { Body, Controller, Get, Headers, Param, Post, Put, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { assertBusinessAdminToken } from '../assert-business-admin-token';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { BusinessAccessService } from '../services/business-access.service';
import { SetBusinessPlanDto } from '../dto/set-business-plan.dto';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller()
export class BusinessAccessController {
  constructor(private readonly business: BusinessAccessService, private readonly auth: AuthService) {}

  private async userId(request: CookieRequest) {
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-seatnow_sid' : 'seatnow_sid';
    return (await this.auth.authenticate(request.cookies?.[cookieName])).id;
  }

  @Post('business/claims/:slug')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  async requestClaim(@Req() request: CookieRequest, @Param('slug') slug: string, @Body() input: CreateClaimDto) {
    return this.business.requestClaim(await this.userId(request), slug, input.evidence);
  }

  @Get('business/claims/me')
  async myClaims(@Req() request: CookieRequest) {
    return this.business.myClaims(await this.userId(request));
  }

  @Get('business/venues')
  async myVenues(@Req() request: CookieRequest) {
    return this.business.myVenues(await this.userId(request));
  }

  @Get('internal/business/claims')
  pendingClaims(@Headers('authorization') authorization: string | undefined) {
    assertBusinessAdminToken(authorization);
    return this.business.pendingClaims();
  }

  @Post('internal/business/claims/:id/approve')
  approveClaim(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    assertBusinessAdminToken(authorization);
    return this.business.approveClaim(id);
  }

  @Post('internal/business/claims/:id/reject')
  rejectClaim(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    assertBusinessAdminToken(authorization);
    return this.business.rejectClaim(id);
  }

  @Put('internal/business/venues/:slug/plan')
  setPlan(@Headers('authorization') authorization: string | undefined, @Param('slug') slug: string, @Body() input: SetBusinessPlanDto) {
    assertBusinessAdminToken(authorization);
    return this.business.setPlan(slug, input);
  }
}
