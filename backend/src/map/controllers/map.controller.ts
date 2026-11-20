import { Controller, ForbiddenException, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { getSessionToken } from '../../auth/session-token';
import { EntitlementService } from '../../subscription/services/entitlement.service';
import { MapQueryDto } from '../dto/map-query.dto';
import { SearchVenuesQueryDto } from '../dto/search-venues-query.dto';
import { MapService } from '../services/map.service';

@Controller('map')
export class MapController {
  constructor(
    private readonly mapService: MapService,
    private readonly auth: AuthService,
    private readonly entitlements: EntitlementService,
  ) {}

  @Get('venues')
  async findNearby(@Query() query: MapQueryDto, @Req() request: Request) {
    if (query.adsHidden !== 'true') return this.mapService.findNearby(query);
    const user = await this.auth.authenticate(getSessionToken(request));
    if (!(await this.entitlements.can(user.id, 'ads.hidden')))
      throw new ForbiddenException('Premium required for an ad-free map');
    return this.mapService.findNearby(query, true);
  }

  @Get('search')
  search(@Query() query: SearchVenuesQueryDto) {
    return this.mapService.searchPublished(query.q);
  }
}
