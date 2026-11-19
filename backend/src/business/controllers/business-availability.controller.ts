import { getSessionToken } from '../../auth/session-token';
import { Body, Controller, Param, Put, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { AvailabilityService } from '../../availability/services/availability.service';
import { ManualAvailabilityDto } from '../dto/manual-availability.dto';
import { BusinessAccessService } from '../services/business-access.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('business/venues')
export class BusinessAvailabilityController {
  constructor(private readonly business: BusinessAccessService, private readonly availability: AvailabilityService,
    private readonly auth: AuthService) {}

  @Put(':slug/availability')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async update(@Req() request: CookieRequest, @Param('slug') slug: string, @Body() input: ManualAvailabilityDto) {
    const user = await this.auth.authenticate(getSessionToken(request));
    await this.business.requireOwner(user.id, slug, true);
    return this.availability.operatorUpdate(slug, input);
  }
}
