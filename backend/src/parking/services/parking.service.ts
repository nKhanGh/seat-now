import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { ParkingQueryDto } from '../dto/parking-query.dto';
import { CreateParkingSnapshotDto } from '../dto/create-parking-snapshot.dto';
import { ParkingFacility } from '../schemas/parking-facility.schema';
import { ParkingSnapshot } from '../schemas/parking-snapshot.schema';
import { VenueMapView } from '../../map/schemas/venue-map-view.schema';
import { LiveGateway } from '../../live/live.gateway';
import { createHash } from 'node:crypto';
import { Types } from 'mongoose';

type ParkingRow = ParkingFacility & { _id: { toString(): string }; distanceM: number; relationRank: number };

function freshness(expiresAt: Date | null | undefined, now: Date) {
  return !expiresAt ? 'UNKNOWN' : expiresAt > now ? 'FRESH' : 'STALE';
}

@Injectable()
export class ParkingService {
  constructor(
    @InjectModel(ParkingFacility.name) private readonly facilities: Model<ParkingFacility>,
    @InjectModel(ParkingSnapshot.name) private readonly snapshots: Model<ParkingSnapshot>,
    @InjectModel(VenueMapView.name) private readonly venues: Model<VenueMapView>,
    private readonly live: LiveGateway,
  ) {}

  async forVenue(slug: string, query: ParkingQueryDto) {
    const venue = await this.venues.findOne({ slug, status: 'ACTIVE' }, { location: 1 }).lean();
    if (!venue) throw new NotFoundException('Venue not found');
    return this.nearby(venue.location.coordinates[1], venue.location.coordinates[0], query, slug);
  }

  async forCoordinates(query: ParkingQueryDto) {
    if (query.lat === undefined || query.lng === undefined)
      throw new BadRequestException('lat and lng are required');
    return this.nearby(query.lat, query.lng, query);
  }

  private async nearby(lat: number, lng: number, query: ParkingQueryDto, venueSlug?: string) {
    const now = new Date();
    const limit = query.limit ?? 20;
    const filterHash = createHash('sha256')
      .update(
        JSON.stringify([
          lat,
          lng,
          query.radiusM,
          venueSlug ?? null,
          query.vehicleType ?? null,
          query.open24h ?? null,
          query.freeOnly ?? null,
          query.hasAvailability ?? null,
        ]),
      )
      .digest('base64url')
      .slice(0, 16);
    let cursor: { relationRank: number; distanceM: number; id: string } | null = null;
    if (query.cursor) {
      try {
        const parsed = JSON.parse(Buffer.from(query.cursor, 'base64url').toString('utf8')) as Record<
          string,
          unknown
        >;
        if (
          parsed.filterHash !== filterHash ||
          ![0, 1].includes(parsed.relationRank as number) ||
          typeof parsed.distanceM !== 'number' ||
          !Number.isFinite(parsed.distanceM) ||
          parsed.distanceM < 0 ||
          typeof parsed.id !== 'string' ||
          !/^[a-f0-9]{24}$/.test(parsed.id)
        )
          throw new Error('invalid cursor');
        cursor = { relationRank: parsed.relationRank as number, distanceM: parsed.distanceM, id: parsed.id };
      } catch {
        throw new BadRequestException({ code: 'PARKING_INVALID_CURSOR', message: 'Invalid parking cursor' });
      }
    }
    const match: Record<string, unknown> = { status: 'ACTIVE' };
    if (query.vehicleType) match.vehicleTypes = query.vehicleType;
    if (query.open24h === 'true') match.open24h = true;
    if (query.freeOnly === 'true') match['pricing.kind'] = 'FREE';
    if (query.hasAvailability === 'true') {
      match.availabilityExpiresAt = { $gt: now };
      match.availableSpaces = { $gt: 0 };
    }
    const pipeline: PipelineStage[] = [
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [lng, lat] },
          distanceField: 'distanceM',
          maxDistance: query.radiusM,
          spherical: true,
        },
      },
      { $match: match },
      {
        $addFields: { relationRank: venueSlug ? { $cond: [{ $in: [venueSlug, '$venueSlugs'] }, 0, 1] } : 0 },
      },
      ...(cursor
        ? [
            {
              $match: {
                $or: [
                  { relationRank: { $gt: cursor.relationRank } },
                  { relationRank: cursor.relationRank, distanceM: { $gt: cursor.distanceM } },
                  {
                    relationRank: cursor.relationRank,
                    distanceM: cursor.distanceM,
                    _id: { $gt: new Types.ObjectId(cursor.id) },
                  },
                ],
              },
            } as PipelineStage,
          ]
        : []),
      { $sort: { relationRank: 1, distanceM: 1, _id: 1 } },
      { $limit: limit + 1 },
    ];
    const rows = await this.facilities.aggregate<ParkingRow>(pipeline);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    const nextCursor =
      rows.length > limit && last
        ? Buffer.from(
            JSON.stringify({
              relationRank: last.relationRank,
              distanceM: last.distanceM,
              id: last._id.toString(),
              filterHash,
            }),
          ).toString('base64url')
        : null;
    return {
      data: page.map((row) => ({
        id: row._id.toString(),
        slug: row.slug,
        name: row.name,
        address: row.address,
        location: row.location,
        distanceM: Math.round(row.distanceM),
        relation: row.kind,
        linkedToVenue: venueSlug ? row.venueSlugs.includes(venueSlug) : false,
        vehicleTypes: row.vehicleTypes,
        isOpenNow: row.open24h ? true : null,
        entranceNote: row.entranceNote,
        pricing: row.pricing,
        availability: {
          availableSpaces: row.availableSpaces ?? null,
          totalSpaces: row.totalSpaces ?? null,
          freshness: freshness(row.availabilityExpiresAt, now),
          source: row.availabilitySource ?? null,
          confidence: row.availabilityConfidence ?? null,
          capturedAt: row.availabilityCapturedAt ?? null,
          expiresAt: row.availabilityExpiresAt ?? null,
          version: row.availabilityVersion ?? null,
        },
      })),
      meta: {
        nextCursor,
        truncated: rows.length > limit,
        distanceType: 'STRAIGHT_LINE',
        queryCenter: { lat, lng },
      },
    };
  }

  async getBySlug(slug: string) {
    const facility = await this.facilities.findOne({ slug, status: 'ACTIVE' }).lean();
    if (!facility) throw new NotFoundException('Parking facility not found');
    const now = new Date();
    return {
      data: {
        slug: facility.slug,
        name: facility.name,
        address: facility.address,
        location: facility.location,
        relation: facility.kind,
        vehicleTypes: facility.vehicleTypes,
        isOpenNow: facility.open24h ? true : null,
        entranceNote: facility.entranceNote,
        pricing: facility.pricing,
        availability: {
          availableSpaces: facility.availableSpaces ?? null,
          totalSpaces: facility.totalSpaces ?? null,
          freshness: freshness(facility.availabilityExpiresAt, now),
          source: facility.availabilitySource ?? null,
          confidence: facility.availabilityConfidence ?? null,
          capturedAt: facility.availabilityCapturedAt ?? null,
          expiresAt: facility.availabilityExpiresAt ?? null,
          version: facility.availabilityVersion ?? null,
        },
      },
    };
  }

  async ingest(slug: string, dto: CreateParkingSnapshotDto) {
    const facility = await this.facilities.exists({ slug, status: 'ACTIVE' });
    if (!facility) throw new NotFoundException('Parking facility not found');
    if (
      (dto.availableSpaces !== null && dto.availableSpaces !== undefined && dto.totalSpaces == null) ||
      (dto.availableSpaces != null && dto.totalSpaces != null && dto.availableSpaces > dto.totalSpaces)
    ) {
      throw new BadRequestException('Invalid parking capacity');
    }
    const capturedAt = new Date(dto.capturedAt);
    const expiresAt = new Date(dto.expiresAt);
    if (
      capturedAt.getTime() > Date.now() + 30_000 ||
      expiresAt <= capturedAt ||
      expiresAt.getTime() > capturedAt.getTime() + 60 * 60_000
    ) {
      throw new BadRequestException('Invalid parking timestamps');
    }
    const record = {
      facilitySlug: slug,
      version: dto.version,
      availableSpaces: dto.availableSpaces ?? null,
      totalSpaces: dto.totalSpaces ?? null,
      source: dto.source,
      sourceRecordId: dto.sourceRecordId,
      confidence: dto.confidence,
      capturedAt,
      expiresAt,
    };
    try {
      await this.snapshots.create(record);
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      const existing = await this.snapshots
        .findOne({ source: dto.source, sourceRecordId: dto.sourceRecordId })
        .lean();
      if (existing?.facilitySlug === slug) return { latestUpdated: false, duplicate: true };
      throw new ConflictException('Parking version already exists');
    }
    const result = await this.facilities.updateOne(
      { slug, $or: [{ availabilityVersion: { $lt: dto.version } }, { availabilityVersion: null }] },
      {
        $set: {
          availabilityVersion: dto.version,
          availableSpaces: dto.availableSpaces ?? null,
          totalSpaces: dto.totalSpaces ?? null,
          availabilitySource: dto.source,
          availabilityConfidence: dto.confidence,
          availabilityCapturedAt: capturedAt,
          availabilityExpiresAt: expiresAt,
        },
      },
    );
    if (result.modifiedCount === 1) this.live.parkingUpdated(slug, dto.version);
    return { latestUpdated: result.modifiedCount === 1, duplicate: false };
  }
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
