import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { VenuesService } from '../../venues/services/venues.service';
import { CheckInDto } from '../dto/check-in.dto';
import { CheckIn } from '../schemas/check-in.schema';

const EARTH_RADIUS_M = 6_371_000;
const CHECK_IN_RADIUS_M = 150;
const CHECK_IN_WINDOW_MS = 3 * 60 * 60 * 1000;

function activitySignal(count: number): 'NONE' | 'LOW' | 'MODERATE' | 'HIGH' {
  if (count === 0) return 'NONE';
  if (count < 3) return 'LOW';
  if (count < 6) return 'MODERATE';
  return 'HIGH';
}

function distanceM(latA: number, lngA: number, latB: number, lngB: number): number {
  const radians = Math.PI / 180;
  const deltaLat = (latB - latA) * radians;
  const deltaLng = (lngB - lngA) * radians;
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(latA * radians) * Math.cos(latB * radians) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

@Injectable()
export class CheckInService {
  constructor(
    @InjectModel(CheckIn.name) private readonly checkIns: Model<CheckIn>,
    private readonly venues: VenuesService,
  ) {}

  async checkIn(userId: string, slug: string, input: CheckInDto) {
    const [venueLng, venueLat] = await this.venues.activeLocation(slug);
    if (input.accuracyM > 100)
      throw new BadRequestException({
        code: 'CHECK_IN_LOW_ACCURACY',
        message: 'Location accuracy is too low',
      });
    if (distanceM(input.lat, input.lng, venueLat, venueLng) > CHECK_IN_RADIUS_M) {
      throw new ForbiddenException({
        code: 'CHECK_IN_TOO_FAR',
        message: 'Move closer to the venue to check in',
      });
    }
    const now = new Date();
    const windowStart = new Date(Math.floor(now.getTime() / CHECK_IN_WINDOW_MS) * CHECK_IN_WINDOW_MS);
    let duplicate = false;
    try {
      await this.checkIns.create({
        userId: new Types.ObjectId(userId),
        venueSlug: slug,
        checkedAt: now,
        windowStart,
      });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      duplicate = true;
    }
    return { data: { duplicate, checkedAt: duplicate ? null : now, summary: await this.summary(slug) } };
  }

  async summary(slug: string) {
    await this.venues.activeLocation(slug);
    const since = new Date(Date.now() - 60 * 60 * 1000);
    const [counts, newest] = await Promise.all([
      this.checkIns.aggregate<{ count: number }>([
        { $match: { venueSlug: slug, checkedAt: { $gte: since } } },
        { $group: { _id: '$userId' } },
        { $count: 'count' },
      ]),
      this.checkIns
        .findOne({ venueSlug: slug, checkedAt: { $gte: since } }, { checkedAt: 1 })
        .sort({ checkedAt: -1 })
        .lean(),
    ]);
    const lastHourUsers = counts[0]?.count ?? 0;
    return {
      lastHourUsers,
      latestAt: newest?.checkedAt ?? null,
      source: 'SELF_REPORTED' as const,
      activitySignal: activitySignal(lastHourUsers),
    };
  }
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
