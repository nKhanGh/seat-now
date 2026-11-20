import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { createHash } from 'node:crypto';
import { MapQueryDto } from '../dto/map-query.dto';
import { VenueMapView } from '../schemas/venue-map-view.schema';
import { venueSearchPattern } from './venue-search-pattern';

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
  sponsorRank: number;
  businessPremiumExpiresAt: Date | null;
  hasLogo: boolean;
  promotionText: string | null;
  promotionStartsAt: Date | null;
  promotionEndsAt: Date | null;
  sponsored: boolean;
};

@Injectable()
export class MapService {
  constructor(@InjectModel(VenueMapView.name) private readonly venues: Model<VenueMapView>) {}

  async searchPublished(query: string) {
    const pattern = venueSearchPattern(query);
    const rows = await this.venues
      .find(
        { status: 'ACTIVE', $or: [{ name: pattern }, { address: pattern }] },
        { slug: 1, name: 1, address: 1, category: 1, location: 1, rating: 1, priceTier: 1 },
      )
      .sort({ name: 1, _id: 1 })
      .limit(13)
      .lean();
    return {
      data: rows.slice(0, 12).map((row) => ({
        id: row._id.toString(),
        slug: row.slug,
        name: row.name,
        address: row.address,
        category: row.category,
        location: row.location,
        rating: row.rating,
        priceTier: row.priceTier,
      })),
      meta: { truncated: rows.length > 12 },
    };
  }

  async findNearby(query: MapQueryDto, adsHidden = false) {
    const now = new Date();
    const limit = query.limit ?? 20;
    const filterHash = createHash('sha256')
      .update(
        JSON.stringify([
          query.lat,
          query.lng,
          query.radiusM,
          query.category ?? null,
          query.cuisine ?? null,
          query.priceTier ?? null,
          query.ratingGte ?? null,
          query.crowdLevel ?? null,
          query.hasAvailability ?? null,
          adsHidden,
        ]),
      )
      .digest('base64url')
      .slice(0, 16);
    let cursor: { sponsorRank: number; distanceM: number; id: string } | null = null;
    if (query.cursor) {
      try {
        if (!/^[A-Za-z0-9_-]+$/.test(query.cursor)) throw new Error('invalid characters');
        const parsed = JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')) as {
          sponsorRank?: unknown;
          distanceM?: unknown;
          id?: unknown;
          filterHash?: unknown;
        };
        if (
          parsed.filterHash !== filterHash ||
          typeof parsed.distanceM !== 'number' ||
          !Number.isFinite(parsed.distanceM) ||
          parsed.distanceM < 0 ||
          ![0, 1].includes(parsed.sponsorRank as number) ||
          typeof parsed.id !== 'string' ||
          !/^[a-f0-9]{24}$/.test(parsed.id)
        )
          throw new Error('invalid cursor');
        cursor = { sponsorRank: parsed.sponsorRank as number, distanceM: parsed.distanceM, id: parsed.id };
      } catch {
        throw new BadRequestException({ code: 'MAP_INVALID_CURSOR', message: 'Invalid map cursor' });
      }
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
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [query.lng, query.lat] },
          distanceField: 'distanceM',
          maxDistance: query.radiusM,
          spherical: true,
        },
      },
      { $match: match },
      {
        $addFields: {
          sponsorRank: {
            $cond: [
              adsHidden
                ? false
                : {
                    $and: [
                      { $eq: ['$sponsored', true] },
                      { $lte: ['$promotionStartsAt', now] },
                      { $gt: ['$promotionEndsAt', now] },
                      { $gt: ['$businessPremiumExpiresAt', now] },
                    ],
                  },
              1,
              0,
            ],
          },
        },
      },
      ...(cursor
        ? [
            {
              $match: {
                $or: [
                  { sponsorRank: { $lt: cursor.sponsorRank } },
                  { sponsorRank: cursor.sponsorRank, distanceM: { $gt: cursor.distanceM } },
                  {
                    sponsorRank: cursor.sponsorRank,
                    distanceM: cursor.distanceM,
                    _id: { $gt: new Types.ObjectId(cursor.id) },
                  },
                ],
              },
            } as PipelineStage,
          ]
        : []),
      { $sort: { sponsorRank: -1, distanceM: 1, _id: 1 } },
      { $limit: limit + 1 },
    ];
    const rows = await this.venues.aggregate<MapRow>(pipeline);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    const nextCursor =
      rows.length > limit && last
        ? Buffer.from(
            JSON.stringify({
              sponsorRank: last.sponsorRank,
              distanceM: last.distanceM,
              id: last._id.toString(),
              filterHash,
            }),
          ).toString('base64url')
        : null;
    return {
      data: page.map((row) => ({
        id: row._id.toString(),
        name: row.name,
        slug: row.slug,
        address: row.address,
        category: row.category,
        cuisineTypes: row.cuisineTypes ?? [],
        location: row.location,
        distanceM: Math.round(row.distanceM),
        priceTier: row.priceTier,
        rating: row.rating,
        verified: Boolean(row.businessPremiumExpiresAt && row.businessPremiumExpiresAt > now),
        logoUrl: row.hasLogo ? `/api/v1/venues/${encodeURIComponent(row.slug)}/logo` : null,
        promotion:
          !adsHidden &&
          row.businessPremiumExpiresAt &&
          row.businessPremiumExpiresAt > now &&
          row.promotionText &&
          row.promotionStartsAt &&
          row.promotionEndsAt &&
          row.promotionStartsAt <= now &&
          row.promotionEndsAt > now
            ? {
                text: row.promotionText,
                startsAt: row.promotionStartsAt,
                endsAt: row.promotionEndsAt,
                sponsored: row.sponsored,
              }
            : null,
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
          freshness: !row.availabilityExpiresAt
            ? 'UNKNOWN'
            : row.availabilityExpiresAt > now
              ? 'FRESH'
              : 'STALE',
        },
      })),
      meta: { nextCursor, truncated: rows.length > limit, queryCenter: { lat: query.lat, lng: query.lng } },
    };
  }
}
