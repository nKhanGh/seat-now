import { getSessionToken } from '../../auth/session-token';
import { Body, Controller, Delete, Param, Put, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { VenuesService } from '../../venues/services/venues.service';
import { UpdateCampaignDto } from '../dto/update-campaign.dto';
import { BusinessAccessService } from '../services/business-access.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('business/venues')
export class BusinessCampaignController {
  constructor(private readonly business: BusinessAccessService, private readonly venues: VenuesService,
    private readonly auth: AuthService) {}

  private async requirePremium(request: CookieRequest, slug: string) {
    const user = await this.auth.authenticate(getSessionToken(request));
    await this.business.requireOwner(user.id, slug, true);
  }

  @Put(':slug/campaign')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async update(@Req() request: CookieRequest, @Param('slug') slug: string, @Body() input: UpdateCampaignDto) {
    await this.requirePremium(request, slug);
    return this.venues.updateCampaign(slug, input);
  }

  @Delete(':slug/campaign')
  async remove(@Req() request: CookieRequest, @Param('slug') slug: string) {
    await this.requirePremium(request, slug);
    return this.venues.clearCampaign(slug);
  }
}
