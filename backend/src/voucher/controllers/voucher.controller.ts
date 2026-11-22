import { getSessionToken } from '../../auth/session-token';
import { Body, Controller, ForbiddenException, Get, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { RequireEntitlement } from '../../subscription/require-entitlement.decorator';
import { CreateVoucherOfferDto } from '../dto/create-voucher-offer.dto';
import { RedeemVoucherDto } from '../dto/redeem-voucher.dto';
import { VoucherService } from '../services/voucher.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller()
export class VoucherController {
  constructor(
    private readonly auth: AuthService,
    private readonly vouchers: VoucherService,
  ) {}

  private async user(request: CookieRequest) {
    return this.auth.authenticate(getSessionToken(request));
  }

  private async requireAdmin(request: CookieRequest) {
    const user = await this.user(request);
    if (user.role !== 'ADMIN') throw new ForbiddenException('Admin access required');
  }

  @Get('premium/vouchers')
  @RequireEntitlement('voucher.exclusive')
  async available(@Req() request: CookieRequest) {
    return this.vouchers.available((await this.user(request)).id);
  }

  @Get('me/vouchers')
  async mine(@Req() request: CookieRequest) {
    return this.vouchers.mine((await this.user(request)).id);
  }

  @Post('premium/vouchers/:id/claim')
  @RequireEntitlement('voucher.exclusive')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async claim(@Req() request: CookieRequest, @Param('id') id: string) {
    return this.vouchers.claim((await this.user(request)).id, id);
  }

  @Get('admin/vouchers')
  async adminList(@Req() request: CookieRequest) {
    await this.requireAdmin(request);
    return this.vouchers.adminList();
  }

  @Post('admin/vouchers')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async create(@Req() request: CookieRequest, @Body() input: CreateVoucherOfferDto) {
    await this.requireAdmin(request);
    return this.vouchers.createOffer(input);
  }

  @Post('admin/vouchers/:id/deactivate')
  async deactivate(@Req() request: CookieRequest, @Param('id') id: string) {
    await this.requireAdmin(request);
    return this.vouchers.deactivate(id);
  }

  @Post('business/venues/:slug/vouchers/redeem')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async redeem(@Req() request: CookieRequest, @Param('slug') slug: string, @Body() input: RedeemVoucherDto) {
    return this.vouchers.redeem((await this.user(request)).id, slug, input.code);
  }
}
