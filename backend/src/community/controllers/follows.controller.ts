import { getSessionToken } from '../../auth/session-token';
import { Controller, Delete, Get, Param, Put, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { FollowsService } from '../services/follows.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller()
export class FollowsController {
  constructor(
    private readonly follows: FollowsService,
    private readonly auth: AuthService,
  ) {}

  private async userId(request: CookieRequest) {
    return (await this.auth.authenticate(getSessionToken(request))).id;
  }

  @Get('users/:id')
  profile(@Param('id') id: string) {
    return this.follows.publicProfile(id);
  }

  @Get('me/follows')
  async list(@Req() request: CookieRequest) {
    return this.follows.list(await this.userId(request));
  }

  @Get('me/follows/:id')
  async status(@Req() request: CookieRequest, @Param('id') id: string) {
    return this.follows.isFollowing(await this.userId(request), id);
  }

  @Put('me/follows/:id')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async follow(@Req() request: CookieRequest, @Param('id') id: string) {
    return this.follows.follow(await this.userId(request), id);
  }

  @Delete('me/follows/:id')
  async unfollow(@Req() request: CookieRequest, @Param('id') id: string) {
    return this.follows.unfollow(await this.userId(request), id);
  }
}
