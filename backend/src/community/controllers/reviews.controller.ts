import { Body, Controller, Delete, Get, Param, Put, Query, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { ReviewQueryDto, UpsertReviewDto } from '../dto/review.dto';
import { ReviewsService } from '../services/reviews.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller()
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService, private readonly auth: AuthService) {}

  private async userId(request: CookieRequest) {
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-seatnow_sid' : 'seatnow_sid';
    return (await this.auth.authenticate(request.cookies?.[cookieName])).id;
  }

  @Get('venues/:slug/reviews')
  list(@Param('slug') slug: string, @Query() query: ReviewQueryDto) { return this.reviews.list(slug, query.cursor); }

  @Put('me/reviews/:slug')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async upsert(@Req() request: CookieRequest, @Param('slug') slug: string, @Body() input: UpsertReviewDto) {
    return this.reviews.upsert(await this.userId(request), slug, input);
  }

  @Delete('me/reviews/:slug')
  async remove(@Req() request: CookieRequest, @Param('slug') slug: string) {
    return this.reviews.remove(await this.userId(request), slug);
  }
}
