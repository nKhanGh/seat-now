import { Controller, Get, Param } from '@nestjs/common';
import { VenuesService } from '../services/venues.service';
import { VenuePageViewService } from '../services/venue-page-view.service';

@Controller('venues')
export class VenuesController {
  constructor(
    private readonly venues: VenuesService,
    private readonly pageViews: VenuePageViewService,
  ) {}

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const result = await this.venues.getBySlug(slug);
    await this.pageViews.record(slug);
    return result;
  }
}
