import { getSessionToken } from '../../auth/session-token';
import {
  Body, Controller, Get, Headers, Param, Post, Put, Req, Res, UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { assertBusinessAdminToken } from '../assert-business-admin-token';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { BusinessAccessService } from '../services/business-access.service';
import { SetBusinessPlanDto } from '../dto/set-business-plan.dto';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller()
export class BusinessAccessController {
  constructor(
    private readonly business: BusinessAccessService,
    private readonly auth: AuthService,
  ) {}

  private async userId(request: CookieRequest) {
    return (await this.auth.authenticate(getSessionToken(request))).id;
  }

  @Post('business/claims/:slug')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('document', { limits: { files: 1, fileSize: 3_000_000 } }))
  async requestClaim(
    @Req() request: CookieRequest,
    @Param('slug') slug: string,
    @Body() input: CreateClaimDto,
    @UploadedFile() file: { buffer: Buffer; size: number } | undefined,
  ) {
    return this.business.requestClaim(await this.userId(request), slug, input.evidence, file);
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

  @Get('internal/business/claims/:id/document')
  async claimDocument(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    assertBusinessAdminToken(authorization);
    const data = await this.business.claimDocument(id);
    response.type('image/webp').setHeader('Cache-Control', 'no-store').send(data);
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
  setPlan(
    @Headers('authorization') authorization: string | undefined,
    @Param('slug') slug: string,
    @Body() input: SetBusinessPlanDto,
  ) {
    assertBusinessAdminToken(authorization);
    return this.business.setPlan(slug, input);
  }
}
