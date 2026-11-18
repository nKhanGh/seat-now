import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { MapQueryDto } from '../dto/map-query.dto';
import { VenueMapView } from '../schemas/venue-map-view.schema';

type MapRow = {
  _id: { toString(): string };
  name: string;
  slug: string;
  address: string;
  category: string;
  location: { type: 'Point'; coordinates: [number, number] };
  priceTier: number;
  rating: number;
  crowdLevel: string;
  tablesAvailable: number | null;
  availabilityExpiresAt: Date | null;
  distanceM: number;
};

@Injectable()
export class MapService {
  constructor(@InjectModel(VenueMapView.name) private readonly venues: Model<VenueMapView>) {}

  async findNearby(query: MapQueryDto) {
    const now = new Date();
    const match: Record<string, unknown> = {};
    if (query.category) match.category = query.category;
    if (query.priceTier) match.priceTier = query.priceTier;
    if (query.ratingGte !== undefined) match.rating = { $gte: query.ratingGte };
    if (query.crowdLevel) match.crowdLevel = query.crowdLevel;
    if (query.hasAvailability === 'true') {
      match.availabilityExpiresAt = { $gt: now };
      match.tablesAvailable = { $gt: 0 };
    }
    const pipeline: PipelineStage[] = [
      { $geoNear: { near: { type: 'Point', coordinates: [query.lng, query.lat] }, distanceField: 'distanceM', maxDistance: query.radiusM, spherical: true } },
      { $match: match },
      { $sort: { distanceM: 1, _id: 1 } },
      { $limit: 51 },
    ];
    const rows = await this.venues.aggregate<MapRow>(pipeline);
    return {
      data: rows.slice(0, 50).map((row) => ({
        id: row._id.toString(), name: row.name, slug: row.slug, address: row.address,
        category: row.category, location: row.location, distanceM: Math.round(row.distanceM),
        priceTier: row.priceTier, rating: row.rating,
        availability: {
          crowdLevel: row.availabilityExpiresAt && row.availabilityExpiresAt > now ? row.crowdLevel : 'UNKNOWN',
          tablesAvailable: row.availabilityExpiresAt && row.availabilityExpiresAt > now ? row.tablesAvailable : null,
          freshness: !row.availabilityExpiresAt ? 'UNKNOWN' : row.availabilityExpiresAt > now ? 'FRESH' : 'STALE',
        },
      })),
      meta: { truncated: rows.length > 50, queryCenter: { lat: query.lat, lng: query.lng } },
    };
  }
}
