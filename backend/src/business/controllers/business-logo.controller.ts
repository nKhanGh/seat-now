import { getSessionToken } from '../../auth/session-token';
import { Controller, Get, Param, Post, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { VenueLogoService } from '../../venues/services/venue-logo.service';
import { VenueCoverService } from '../../venues/services/venue-cover.service';
import { BusinessAccessService } from '../services/business-access.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller()
export class BusinessLogoController {
  constructor(private readonly business: BusinessAccessService, private readonly logos: VenueLogoService,
    private readonly covers: VenueCoverService,
    private readonly auth: AuthService) {}

  @Post('business/venues/:slug/logo')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('logo', { limits: { files: 1, fileSize: 2_000_000 } }))
  async upload(@Req() request: CookieRequest, @Param('slug') slug: string,
    @UploadedFile() file: { buffer: Buffer; size: number } | undefined) {
    const user = await this.auth.authenticate(getSessionToken(request));
    await this.business.requireOwner(user.id, slug);
    return this.logos.upload(slug, file);
  }

  @Get('venues/:slug/logo')
  async get(@Param('slug') slug: string, @Res() response: Response) {
    const data = await this.logos.get(slug);
    response.type('image/webp').setHeader('Cache-Control', 'no-store').send(data);
  }

  @Post('business/venues/:slug/cover')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @UseInterceptors(FileInterceptor('cover', { limits: { files: 1, fileSize: 2_000_000 } }))
  async uploadCover(@Req() request: CookieRequest, @Param('slug') slug: string,
    @UploadedFile() file: { buffer: Buffer; size: number } | undefined) {
    const user = await this.auth.authenticate(getSessionToken(request));
    await this.business.requireOwner(user.id, slug, true);
    return this.covers.upload(slug, file);
  }

  @Get('venues/:slug/cover')
  async getCover(@Param('slug') slug: string, @Res() response: Response) {
    const data = await this.covers.get(slug);
    response.type('image/webp').setHeader('Cache-Control', 'no-store').send(data);
  }
}
