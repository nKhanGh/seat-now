import { getSessionToken } from '../../auth/session-token';
import { Controller, Delete, Get, Param, Put, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { FavoritesService } from '../services/favorites.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('me/favorites')
export class FavoritesController {
  constructor(
    private readonly favorites: FavoritesService,
    private readonly auth: AuthService,
  ) {}

  private async userId(request: CookieRequest) {
    return (await this.auth.authenticate(getSessionToken(request))).id;
  }

  @Get()
  async list(@Req() request: CookieRequest) {
    return this.favorites.list(await this.userId(request));
  }

  @Put(':slug')
  async save(@Req() request: CookieRequest, @Param('slug') slug: string) {
    return this.favorites.save(await this.userId(request), slug);
  }

  @Delete(':slug')
  async remove(@Req() request: CookieRequest, @Param('slug') slug: string) {
    return this.favorites.remove(await this.userId(request), slug);
  }
}
