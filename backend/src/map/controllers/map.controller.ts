import { Controller, Get, Query } from '@nestjs/common';
import { MapQueryDto } from '../dto/map-query.dto';
import { SearchVenuesQueryDto } from '../dto/search-venues-query.dto';
import { MapService } from '../services/map.service';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('venues')
  findNearby(@Query() query: MapQueryDto) {
    return this.mapService.findNearby(query);
  }

  @Get('search')
  search(@Query() query: SearchVenuesQueryDto) {
    return this.mapService.searchPublished(query.q);
  }
}
