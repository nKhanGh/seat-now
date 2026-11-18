import { Controller, Get, Headers, Param, Post, Body } from '@nestjs/common';
import { assertIngestToken } from '../assert-ingest-token';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { AvailabilityService } from '../services/availability.service';

@Controller()
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get('venues/:slug/availability')
  get(@Param('slug') slug: string) { return this.availability.getBySlug(slug); }

  @Post('internal/venues/:slug/availability-snapshots')
  ingest(@Param('slug') slug: string, @Headers('authorization') authorization: string | undefined, @Body() body: CreateAvailabilityDto) {
    assertIngestToken(authorization);
    return this.availability.ingest(slug, body);
  }
}
