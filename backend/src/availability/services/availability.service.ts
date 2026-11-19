import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateAvailabilityDto } from '../dto/create-availability.dto';
import { AvailabilityLatest, AvailabilitySnapshot, Capacity } from '../schemas/availability-snapshot.schema';
import { VenueMapView } from '../../map/schemas/venue-map-view.schema';
import { LiveGateway } from '../../live/live.gateway';
import { randomInt, randomUUID } from 'node:crypto';
import type { ManualAvailabilityDto } from '../../business/dto/manual-availability.dto';

type AvailabilityRecord = {
  version: number; tables: Capacity; seats: Capacity; crowdLevel: string;
  estimatedWaitMinutes: number | null; acceptingGuests: boolean; source: string;
  confidence: number; capturedAt: Date; expiresAt: Date;
};

export function publicAvailability(record: AvailabilityRecord | null, now = new Date()) {
  if (!record) return { freshness: 'UNKNOWN' as const, version: null, tables: null, seats: null, crowdLevel: 'UNKNOWN', estimatedWaitMinutes: null, acceptingGuests: null, source: null, confidence: null, capturedAt: null, expiresAt: null };
  return {
    freshness: record.expiresAt > now ? 'FRESH' as const : 'STALE' as const,
    version: record.version, tables: record.tables, seats: record.seats,
    crowdLevel: record.crowdLevel, estimatedWaitMinutes: record.estimatedWaitMinutes,
    acceptingGuests: record.acceptingGuests, source: record.source,
    confidence: record.confidence, capturedAt: record.capturedAt, expiresAt: record.expiresAt,
  };
}

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectModel(AvailabilitySnapshot.name) private readonly snapshots: Model<AvailabilitySnapshot>,
    @InjectModel(AvailabilityLatest.name) private readonly latest: Model<AvailabilityLatest>,
    @InjectModel(VenueMapView.name) private readonly venues: Model<VenueMapView>,
    private readonly live: LiveGateway,
  ) {}

  async getBySlug(slug: string) {
    const venue = await this.venues.exists({ slug, status: 'ACTIVE' });
    if (!venue) throw new NotFoundException('Venue not found');
    return { data: await this.summaryForSlug(slug) };
  }

  async summaryForSlug(slug: string) {
    const record = await this.latest.findOne({ slug }).lean();
    return publicAvailability(record);
  }

  async operatorUpdate(slug: string, input: ManualAvailabilityDto) {
    if (!input.tables && !input.seats) throw new BadRequestException('Tables or seats are required');
    const current = await this.latest.findOne({ slug }, { version: 1 }).lean();
    const now = new Date();
    return this.ingest(slug, {
      version: Math.max((current?.version ?? 0) + 1, Date.now() * 1000 + randomInt(1000)),
      tables: input.tables ?? null, seats: input.seats ?? null,
      crowdLevel: input.crowdLevel, estimatedWaitMinutes: input.estimatedWaitMinutes ?? null,
      acceptingGuests: input.acceptingGuests, source: 'OPERATOR', sourceRecordId: randomUUID(),
      confidence: 0.7, capturedAt: now.toISOString(), expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
    });
  }

  async ingest(slug: string, dto: CreateAvailabilityDto) {
    const venue = await this.venues.exists({ slug, status: 'ACTIVE' });
    if (!venue) throw new NotFoundException('Venue not found');
    for (const capacity of [dto.tables, dto.seats]) {
      if (capacity && capacity.available > capacity.total) throw new BadRequestException('Available capacity exceeds total');
    }
    const capturedAt = new Date(dto.capturedAt);
    const expiresAt = new Date(dto.expiresAt);
    if (capturedAt.getTime() > Date.now() + 30_000 || expiresAt <= capturedAt || expiresAt.getTime() > capturedAt.getTime() + 60 * 60_000) {
      throw new BadRequestException('Invalid availability timestamps');
    }
    const record = {
      slug, version: dto.version, tables: dto.tables ?? null, seats: dto.seats ?? null,
      crowdLevel: dto.crowdLevel, estimatedWaitMinutes: dto.estimatedWaitMinutes ?? null,
      acceptingGuests: dto.acceptingGuests, source: dto.source, sourceRecordId: dto.sourceRecordId,
      confidence: dto.confidence, capturedAt, expiresAt,
    };
    try {
      await this.snapshots.create(record);
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      const existing = await this.snapshots.findOne({ source: dto.source, sourceRecordId: dto.sourceRecordId }).lean();
      if (existing?.slug === slug) return { data: publicAvailability(existing), latestUpdated: false, duplicate: true };
      throw new ConflictException('Availability version already exists');
    }
    let latestUpdated = false;
    try {
      const update = await this.latest.findOneAndUpdate(
        { slug, $or: [{ version: { $lt: dto.version } }, { version: { $exists: false } }] },
        { $set: record }, { upsert: true, new: true, projection: { sourceRecordId: 0 } },
      );
      latestUpdated = update?.version === dto.version;
    } catch (error) {
      if (!isDuplicate(error)) throw error;
    }
    if (latestUpdated) {
      await this.venues.updateOne(
        { slug, $or: [{ availabilityVersion: { $lt: dto.version } }, { availabilityVersion: null }] },
        { $set: {
          availabilityVersion: dto.version, crowdLevel: dto.crowdLevel,
          tablesAvailable: dto.tables?.available ?? null, tablesTotal: dto.tables?.total ?? null,
          seatsAvailable: dto.seats?.available ?? null, seatsTotal: dto.seats?.total ?? null,
          estimatedWaitMinutes: dto.estimatedWaitMinutes ?? null, acceptingGuests: dto.acceptingGuests,
          availabilitySource: dto.source, availabilityConfidence: dto.confidence,
          availabilityCapturedAt: capturedAt, availabilityExpiresAt: expiresAt,
        } },
      );
      this.live.venueUpdated(slug, dto.version);
    }
    return { data: publicAvailability(record), latestUpdated, duplicate: false };
  }
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
