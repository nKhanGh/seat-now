import { Controller, Get, Param } from '@nestjs/common';
import { VenuesService } from '../services/venues.service';

@Controller('venues')
export class VenuesController {
  constructor(private readonly venues: VenuesService) {}

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) { return this.venues.getBySlug(slug); }
}
