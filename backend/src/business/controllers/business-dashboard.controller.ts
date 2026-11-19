import { Controller, Get, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { AvailabilityService } from '../../availability/services/availability.service';
import { VenuePageViewService } from '../../venues/services/venue-page-view.service';
import { BusinessAccessService } from '../services/business-access.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('business/venues')
export class BusinessDashboardController {
  constructor(private readonly business: BusinessAccessService, private readonly pageViews: VenuePageViewService,
    private readonly availability: AvailabilityService, private readonly auth: AuthService) {}

  @Get(':slug/dashboard')
  async get(@Req() request: CookieRequest, @Param('slug') slug: string) {
    const cookieName = process.env.NODE_ENV === 'production' ? '__Host-seatnow_sid' : 'seatnow_sid';
    const user = await this.auth.authenticate(request.cookies?.[cookieName]);
    await this.business.requireOwner(user.id, slug, true);
    const [views, occupancy] = await Promise.all([
      this.pageViews.sevenDaySummary(slug), this.availability.sevenDayOccupancy(slug),
    ]);
    return { data: { periodDays: 7, views, occupancy } };
  }
}
