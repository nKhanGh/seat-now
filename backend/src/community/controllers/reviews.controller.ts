import { Body, Controller, Delete, Get, Headers, Param, Post, Put, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from '../../auth/services/auth.service';
import { ReviewQueryDto, UpsertReviewDto } from '../dto/review.dto';
import { ReviewsService } from '../services/reviews.service';
import { ReportReviewDto } from '../dto/report-review.dto';
import { assertModerationToken } from '../assert-moderation-token';

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

  @Post('me/reviews/:slug/photo')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('photo', { limits: { files: 1, fileSize: 2_000_000 } }))
  async uploadPhoto(@Req() request: CookieRequest, @Param('slug') slug: string,
    @UploadedFile() file: { buffer: Buffer; size: number } | undefined) {
    return this.reviews.uploadPhoto(await this.userId(request), slug, file);
  }

  @Get('reviews/:id/photo')
  async photo(@Param('id') id: string, @Res() response: Response) {
    const data = await this.reviews.getPhoto(id);
    response.type('image/webp').setHeader('Cache-Control', 'no-store').send(data);
  }

  @Post('reviews/:id/reports')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async report(@Req() request: CookieRequest, @Param('id') id: string, @Body() input: ReportReviewDto) {
    return this.reviews.report(await this.userId(request), id, input.reason);
  }

  @Get('internal/community/review-reports')
  pendingReports(@Headers('authorization') authorization: string | undefined) {
    assertModerationToken(authorization);
    return this.reviews.pendingReports();
  }

  @Post('internal/community/reviews/:id/hide')
  hide(@Headers('authorization') authorization: string | undefined, @Param('id') id: string) {
    assertModerationToken(authorization);
    return this.reviews.hide(id);
  }
}
