import { getSessionToken } from '../../auth/session-token';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { Types } from 'mongoose';
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

  private async requireAdmin(request: CookieRequest) {
    const user = await this.auth.authenticate(getSessionToken(request));
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
  }

  @Get('community/proposals')
  list(@Query() query: ProposalQueryDto) {
    return this.proposals.list(query.status);
  }

  @Get('community/proposals/mine')
  async mine(@Req() request: CookieRequest) {
    return this.proposals.mine(await this.userId(request));
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

  @Get('admin/community/proposals')
  async adminReadyProposals(@Req() request: CookieRequest) {
    await this.requireAdmin(request);
    const result = await this.proposals.readyForReview();
    const users = await this.auth.adminUsersByIds(
      result.data.map((row) => new Types.ObjectId(row.createdBy)),
    );
    const byId = new Map(users.map((user) => [user.id, user]));
    return {
      data: result.data.map(({ createdBy, ...proposal }) => ({
        ...proposal,
        applicant: byId.get(createdBy) ?? null,
      })),
      meta: result.meta,
    };
  }

  @Post('admin/community/proposals/:id/approve')
  @HttpCode(200)
  async adminApprove(@Req() request: CookieRequest, @Param('id') id: string) {
    await this.requireAdmin(request);
    return this.proposals.approve(id);
  }

  @Post('admin/community/proposals/:id/reject')
  @HttpCode(200)
  async adminReject(@Req() request: CookieRequest, @Param('id') id: string) {
    await this.requireAdmin(request);
    return this.proposals.reject(id);
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
