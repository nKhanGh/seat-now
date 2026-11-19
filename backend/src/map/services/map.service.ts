import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { MapQueryDto } from '../dto/map-query.dto';
import { VenueMapView } from '../schemas/venue-map-view.schema';

type MapRow = {
  _id: { toString(): string };
  name: string;
  slug: string;
  address: string;
  category: string;
  cuisineTypes: string[];
  location: { type: 'Point'; coordinates: [number, number] };
  priceTier: number;
  rating: number;
  crowdLevel: string;
  tablesAvailable: number | null;
  tablesTotal: number | null;
  seatsAvailable: number | null;
  seatsTotal: number | null;
  estimatedWaitMinutes: number | null;
  acceptingGuests: boolean | null;
  availabilitySource: string | null;
  availabilityConfidence: number | null;
  availabilityVersion: number | null;
  availabilityCapturedAt: Date | null;
  availabilityExpiresAt: Date | null;
  distanceM: number;
};

@Injectable()
export class MapService {
  constructor(@InjectModel(VenueMapView.name) private readonly venues: Model<VenueMapView>) {}

  async findNearby(query: MapQueryDto) {
    const now = new Date();
    const limit = query.limit ?? 20;
    const filterHash = createHash('sha256').update(JSON.stringify([
      query.lat, query.lng, query.radiusM, query.category ?? null, query.cuisine ?? null,
      query.priceTier ?? null, query.ratingGte ?? null, query.crowdLevel ?? null,
      query.hasAvailability ?? null,
    ])).digest('base64url').slice(0, 16);
    let cursor: { distanceM: number; id: string } | null = null;
    if (query.cursor) {
      try {
        if (!/^[A-Za-z0-9_-]+$/.test(query.cursor)) throw new Error('invalid characters');
        const parsed = JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')) as { distanceM?: unknown; id?: unknown; filterHash?: unknown };
        if (parsed.filterHash !== filterHash || typeof parsed.distanceM !== 'number' || !Number.isFinite(parsed.distanceM)
          || parsed.distanceM < 0 || typeof parsed.id !== 'string' || !/^[a-f0-9]{24}$/.test(parsed.id)) throw new Error('invalid cursor');
        cursor = { distanceM: parsed.distanceM, id: parsed.id };
      } catch { throw new BadRequestException({ code: 'MAP_INVALID_CURSOR', message: 'Invalid map cursor' }); }
    }
    const match: Record<string, unknown> = { status: 'ACTIVE' };
    if (query.category) match.category = query.category;
    if (query.cuisine) match.cuisineTypes = query.cuisine;
    if (query.priceTier) match.priceTier = query.priceTier;
    if (query.ratingGte !== undefined) match.rating = { $gte: query.ratingGte };
    if (query.crowdLevel) {
      match.crowdLevel = query.crowdLevel;
      match.availabilityExpiresAt = { $gt: now };
    }
    if (query.hasAvailability === 'true') {
      match.availabilityExpiresAt = { $gt: now };
      match.acceptingGuests = true;
      match.$or = [{ tablesAvailable: { $gt: 0 } }, { seatsAvailable: { $gt: 0 } }];
    }
    const pipeline: PipelineStage[] = [
      { $geoNear: { near: { type: 'Point', coordinates: [query.lng, query.lat] }, distanceField: 'distanceM', maxDistance: query.radiusM, spherical: true } },
      { $match: match },
      ...(cursor ? [{ $match: { $or: [
        { distanceM: { $gt: cursor.distanceM } },
        { distanceM: cursor.distanceM, _id: { $gt: new Types.ObjectId(cursor.id) } },
      ] } } as PipelineStage] : []),
      { $sort: { distanceM: 1, _id: 1 } },
      { $limit: limit + 1 },
    ];
    const rows = await this.venues.aggregate<MapRow>(pipeline);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    const nextCursor = rows.length > limit && last
      ? Buffer.from(JSON.stringify({ distanceM: last.distanceM, id: last._id.toString(), filterHash })).toString('base64url')
      : null;
    return {
      data: page.map((row) => ({
        id: row._id.toString(), name: row.name, slug: row.slug, address: row.address,
        category: row.category, cuisineTypes: row.cuisineTypes ?? [], location: row.location, distanceM: Math.round(row.distanceM),
        priceTier: row.priceTier, rating: row.rating,
        availability: {
          crowdLevel: row.availabilityExpiresAt ? row.crowdLevel : 'UNKNOWN',
          tablesAvailable: row.tablesAvailable ?? null,
          tablesTotal: row.tablesTotal ?? null,
          seatsAvailable: row.seatsAvailable ?? null,
          seatsTotal: row.seatsTotal ?? null,
          estimatedWaitMinutes: row.estimatedWaitMinutes ?? null,
          acceptingGuests: row.acceptingGuests ?? null,
          source: row.availabilitySource ?? null,
          confidence: row.availabilityConfidence ?? null,
          version: row.availabilityVersion ?? null,
          capturedAt: row.availabilityCapturedAt ?? null,
          expiresAt: row.availabilityExpiresAt ?? null,
          freshness: !row.availabilityExpiresAt ? 'UNKNOWN' : row.availabilityExpiresAt > now ? 'FRESH' : 'STALE',
        },
      })),
      meta: { nextCursor, truncated: rows.length > limit, queryCenter: { lat: query.lat, lng: query.lng } },
    };
  }
}
