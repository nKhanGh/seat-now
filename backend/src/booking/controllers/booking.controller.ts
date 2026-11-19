import { Body, Controller, Get, Param, Patch, Post, Put, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { getSessionToken } from '../../auth/session-token';
import { BookingSettingsDto } from '../dto/booking-settings.dto';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { ResolveBookingDto } from '../dto/resolve-booking.dto';
import { BookingService } from '../services/booking.service';

@Controller()
export class BookingController {
  constructor(
    private readonly bookings: BookingService,
    private readonly auth: AuthService,
  ) {}

  private async userId(request: Request) {
    return (await this.auth.authenticate(getSessionToken(request))).id;
  }

  @Get('venues/:slug/booking-status')
  status(@Param('slug') slug: string) {
    return this.bookings.bookingStatus(slug);
  }

  @Post('venues/:slug/bookings')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(@Req() request: Request, @Param('slug') slug: string, @Body() input: CreateBookingDto) {
    return this.bookings.create(await this.userId(request), slug, input);
  }

  @Get('me/bookings')
  async mine(@Req() request: Request) {
    return this.bookings.mine(await this.userId(request));
  }

  @Patch('me/bookings/:id/cancel')
  async cancel(@Req() request: Request, @Param('id') id: string) {
    return this.bookings.cancel(await this.userId(request), id);
  }

  @Put('business/venues/:slug/booking-settings')
  async settings(@Req() request: Request, @Param('slug') slug: string, @Body() input: BookingSettingsDto) {
    return this.bookings.setBookingEnabled(await this.userId(request), slug, input.enabled);
  }

  @Get('business/venues/:slug/bookings')
  async forVenue(@Req() request: Request, @Param('slug') slug: string) {
    return this.bookings.forVenue(await this.userId(request), slug);
  }

  @Patch('business/venues/:slug/bookings/:id')
  async resolve(
    @Req() request: Request,
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() input: ResolveBookingDto,
  ) {
    return this.bookings.resolve(await this.userId(request), slug, id, input.status);
  }
}
