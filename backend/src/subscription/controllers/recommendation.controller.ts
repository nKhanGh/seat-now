import { getSessionToken } from '../../auth/session-token';
import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../auth/services/auth.service';
import { RequireEntitlement } from '../require-entitlement.decorator';
import { RecommendationQueryDto } from '../dto/recommendation-query.dto';
import { RecommendationService } from '../services/recommendation.service';

type CookieRequest = Request & { cookies?: Record<string, string> };

@Controller('me/recommendations')
export class RecommendationController {
  constructor(
    private readonly auth: AuthService,
    private readonly recommendations: RecommendationService,
  ) {}

  @Get()
  @RequireEntitlement('recommendation.advanced')
  async list(@Req() request: CookieRequest, @Query() query: RecommendationQueryDto) {
    const user = await this.auth.authenticate(getSessionToken(request));
    return this.recommendations.recommend(user.id, query);
  }
}
