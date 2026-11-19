import { getSessionToken } from '../../auth/session-token';
import { Body, Controller, Get, Headers, Param, Post, Put, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { assertModerationToken } from '../assert-moderation-token';
import { CreateVenueProposalDto, ProposalQueryDto } from '../dto/venue-proposal.dto';
import { ProposalsService } from '../services/proposals.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller()
export class ProposalsController {
  constructor(
    private readonly proposals: ProposalsService,
    private readonly auth: AuthService,
  ) {}

  private async userId(request: CookieRequest) {
    return (await this.auth.authenticate(getSessionToken(request))).id;
  }

  @Get('community/proposals')
  list(@Query() query: ProposalQueryDto) {
    return this.proposals.list(query.status);
  }

  @Post('community/proposals')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(@Req() request: CookieRequest, @Body() input: CreateVenueProposalDto) {
    return this.proposals.create(await this.userId(request), input);
  }

  @Put('community/proposals/:id/confirm')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async confirm(@Req() request: CookieRequest, @Param('id') id: string) {
    return this.proposals.confirm(await this.userId(request), id);
  }

  @Post('internal/community/proposals/:id/approve')
  approve(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    assertModerationToken(authorization);
    return this.proposals.approve(id);
  }

  @Post('internal/community/proposals/:id/reject')
  reject(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    assertModerationToken(authorization);
    return this.proposals.reject(id);
  }
}
