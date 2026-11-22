import { getSessionToken } from '../../auth/session-token';
import { BadRequestException, Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { RequireEntitlement } from '../../subscription/require-entitlement.decorator';
import { CreateParkingReservationDto } from '../dto/create-parking-reservation.dto';
import { ParkingReservationService } from '../services/parking-reservation.service';
import { UpdateParkingAvailabilityDto } from '../dto/update-parking-availability.dto';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller()
export class ParkingReservationController {
  constructor(
    private readonly auth: AuthService,
    private readonly reservations: ParkingReservationService,
  ) {}

  private async userId(request: CookieRequest) {
    return (await this.auth.authenticate(getSessionToken(request))).id;
  }

  @Post('venues/:slug/parking/:facilitySlug/reservations')
  @RequireEntitlement('parking.reserve')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async create(
    @Req() request: CookieRequest,
    @Param('slug') slug: string,
    @Param('facilitySlug') facilitySlug: string,
    @Body() input: CreateParkingReservationDto,
  ) {
    return this.reservations.create(await this.userId(request), slug, facilitySlug, input);
  }

  @Get('me/parking-reservations')
  async mine(@Req() request: CookieRequest) {
    return this.reservations.mine(await this.userId(request));
  }

  @Post('me/parking-reservations/:id/cancel')
  async cancel(@Req() request: CookieRequest, @Param('id') id: string) {
    return this.reservations.cancel(await this.userId(request), id);
  }

  @Get('business/venues/:slug/parking-reservations')
  async forVenue(@Req() request: CookieRequest, @Param('slug') slug: string) {
    return this.reservations.forVenue(await this.userId(request), slug);
  }

  @Get('business/venues/:slug/parking-facilities')
  async ownedFacilities(@Req() request: CookieRequest, @Param('slug') slug: string) {
    return this.reservations.ownedFacilities(await this.userId(request), slug);
  }

  @Post('business/venues/:slug/parking-facilities/:facilitySlug/availability')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async updateAvailability(
    @Req() request: CookieRequest,
    @Param('slug') slug: string,
    @Param('facilitySlug') facilitySlug: string,
    @Body() input: UpdateParkingAvailabilityDto,
  ) {
    return this.reservations.updateAvailability(await this.userId(request), slug, facilitySlug, input);
  }

  @Post('business/venues/:slug/parking-reservations/:id/:action')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async resolve(
    @Req() request: CookieRequest,
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Param('action') action: string,
  ) {
    if (!['confirm', 'decline', 'complete'].includes(action))
      throw new BadRequestException('Invalid reservation action');
    return this.reservations.resolve(
      await this.userId(request),
      slug,
      id,
      action as 'confirm' | 'decline' | 'complete',
    );
  }
}
