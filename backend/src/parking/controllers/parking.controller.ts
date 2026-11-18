import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { assertIngestToken } from '../../availability/assert-ingest-token';
import { CreateParkingSnapshotDto } from '../dto/create-parking-snapshot.dto';
import { ParkingQueryDto } from '../dto/parking-query.dto';
import { ParkingService } from '../services/parking.service';

@Controller()
export class ParkingController {
  constructor(private readonly parking: ParkingService) {}

  @Get('venues/:slug/parking')
  forVenue(@Param('slug') slug: string, @Query() query: ParkingQueryDto) { return this.parking.forVenue(slug, query); }

  @Get('parking-facilities')
  forCoordinates(@Query() query: ParkingQueryDto) { return this.parking.forCoordinates(query); }

  @Get('parking-facilities/:slug')
  detail(@Param('slug') slug: string) { return this.parking.getBySlug(slug); }

  @Post('internal/parking-facilities/:slug/availability-snapshots')
  ingest(@Param('slug') slug: string, @Headers('authorization') authorization: string | undefined, @Body() body: CreateParkingSnapshotDto) {
    assertIngestToken(authorization);
    return this.parking.ingest(slug, body);
  }
}
