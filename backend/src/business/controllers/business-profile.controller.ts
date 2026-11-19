import { Body, Controller, Param, Put, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { VenuesService } from '../../venues/services/venues.service';
import { UpdateBusinessProfileDto } from '../dto/update-business-profile.dto';
import { BusinessAccessService } from '../services/business-access.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('business/venues')
export class BusinessProfileController {
  constructor(private readonly business: BusinessAccessService, private readonly venues: VenuesService, private readonly auth: AuthService) {}

  @Put(':slug/profile')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async update(@Req() request: CookieRequest, @Param('slug') slug: string, @Body() input: UpdateBusinessProfileDto) {
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-seatnow_sid' : 'seatnow_sid';
    const user = await this.auth.authenticate(request.cookies?.[cookieName]);
    await this.business.requireOwner(user.id, slug);
    return this.venues.updateBusinessProfile(slug, input);
  }
}
