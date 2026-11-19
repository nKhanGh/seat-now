import { getSessionToken } from '../../auth/session-token';
import { Body, Controller, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { CheckInDto } from '../dto/check-in.dto';
import { CheckInService } from '../services/check-in.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('venues/:slug/check-ins')
export class CheckInController {
  constructor(
    private readonly checkIns: CheckInService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async summary(@Param('slug') slug: string) {
    return { data: await this.checkIns.summary(slug) };
  }

  @Post()
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(@Param('slug') slug: string, @Req() request: CookieRequest, @Body() input: CheckInDto) {
    const user = await this.auth.authenticate(getSessionToken(request));
    return this.checkIns.checkIn(user.id, slug, input);
  }
}
