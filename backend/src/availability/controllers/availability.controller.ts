import { Controller, Get, Headers, Param, Post, Body, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { AvailabilityService } from '../services/availability.service';

@Controller()
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get('venues/:slug/availability')
  get(@Param('slug') slug: string) { return this.availability.getBySlug(slug); }

  @Post('internal/venues/:slug/availability-snapshots')
  ingest(@Param('slug') slug: string, @Headers('authorization') authorization: string | undefined, @Body() body: CreateAvailabilityDto) {
    const secret = process.env.AVAILABILITY_INGEST_TOKEN;
    if (!secret) throw new ServiceUnavailableException('Availability ingestion is not configured');
    const expected = Buffer.from(`Bearer ${secret}`);
    const actual = Buffer.from(authorization ?? '');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new UnauthorizedException();
    return this.availability.ingest(slug, body);
  }
}
