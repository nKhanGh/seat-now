import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from '../../auth/services/auth.service';
import { VenuesService } from '../../venues/services/venues.service';
import { BusinessAccess } from '../schemas/business-access.schema';
import { BusinessClaim } from '../schemas/business-claim.schema';
import { SetBusinessPlanDto } from '../dto/set-business-plan.dto';

@Injectable()
export class BusinessAccessService {
  constructor(
    @InjectModel(BusinessClaim.name) private readonly claims: Model<BusinessClaim>,
    @InjectModel(BusinessAccess.name) private readonly access: Model<BusinessAccess>,
    private readonly venues: VenuesService,
    private readonly auth: AuthService,
  ) {}

  async requestClaim(userId: string, slug: string, evidence: string) {
    await this.venues.activeLocation(slug);
    if (await this.access.exists({ venueSlug: slug })) throw new ConflictException('Venue already managed');
    const trimmed = evidence.trim();
    if (trimmed.length < 20) throw new BadRequestException('Evidence is too short');
    const owner = new Types.ObjectId(userId);
    try {
      const claim = await this.claims.create({ userId: owner, venueSlug: slug, evidence: trimmed });
      return { data: this.publicClaim(claim) };
    } catch (error) {
      if (isDuplicate(error)) throw new ConflictException('Claim already submitted');
      throw error;
    }
  }

  async myClaims(userId: string) {
    const claims = await this.claims
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean();
    return { data: claims.map((claim) => this.publicClaim(claim)) };
  }

  async myVenues(userId: string) {
    const rows = await this.access
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ venueSlug: 1 })
      .limit(100)
      .lean();
    const profiles = await this.venues.publicProfilesBySlugs(rows.map((row) => row.venueSlug));
    const bySlug = new Map(profiles.map((profile) => [profile.slug, profile]));
    return {
      data: rows
        .filter((row) => bySlug.has(row.venueSlug))
        .map((row) => ({
          ...bySlug.get(row.venueSlug),
          plan: this.effectivePlan(row),
          verified: this.effectivePlan(row) === 'PREMIUM',
        })),
    };
  }

  async pendingClaims() {
    const rows = await this.claims
      .find({ status: 'PENDING' })
      .sort({ createdAt: 1, _id: 1 })
      .limit(100)
      .lean();
    return {
      data: rows.map((row) => ({
        ...this.publicClaim(row),
        userId: row.userId.toString(),
        evidence: row.evidence,
      })),
    };
  }

  async approveClaim(id: string) {
    const claim = await this.findClaim(id);
    if (claim.status === 'APPROVED') return { data: { id, status: 'APPROVED' } };
    if (claim.status !== 'PENDING') throw new ConflictException('Claim already rejected');
    await this.auth.publicProfileById(claim.userId.toString());
    await this.venues.activeLocation(claim.venueSlug);
    try {
      await this.access.create({ userId: claim.userId, venueSlug: claim.venueSlug, plan: 'FREE' });
    } catch (error) {
      if (isDuplicate(error)) {
        const existing = await this.access.findOne({ venueSlug: claim.venueSlug }, { userId: 1 }).lean();
        if (existing?.userId.toString() !== claim.userId.toString())
          throw new ConflictException('Venue already managed');
      } else throw error;
    }
    await this.claims.updateOne({ _id: claim._id, status: 'PENDING' }, { $set: { status: 'APPROVED' } });
    return { data: { id, status: 'APPROVED' } };
  }

  async rejectClaim(id: string) {
    const claim = await this.findClaim(id);
    if (claim.status !== 'PENDING') throw new ConflictException('Claim already closed');
    await this.claims.updateOne({ _id: claim._id, status: 'PENDING' }, { $set: { status: 'REJECTED' } });
    return { data: { id, status: 'REJECTED' } };
  }

  async requireOwner(userId: string, slug: string, premium = false) {
    const owner = await this.access.findOne({ userId: new Types.ObjectId(userId), venueSlug: slug }).lean();
    if (!owner) throw new ForbiddenException('Venue management access required');
    if (premium && this.effectivePlan(owner) !== 'PREMIUM')
      throw new ForbiddenException('Premium business plan required');
    return owner;
  }

  async setPlan(slug: string, input: SetBusinessPlanDto) {
    const owner = await this.access.findOne({ venueSlug: slug });
    if (!owner) throw new NotFoundException('Managed venue not found');
    await this.venues.activeLocation(slug);
    const expiresAt =
      input.plan === 'PREMIUM' && input.premiumExpiresAt ? new Date(input.premiumExpiresAt) : null;
    if (
      input.plan === 'PREMIUM' &&
      (!expiresAt ||
        expiresAt.getTime() <= Date.now() ||
        expiresAt.getTime() > Date.now() + 366 * 24 * 60 * 60_000)
    ) {
      throw new BadRequestException('Premium expiration must be within the next year');
    }
    await this.access.updateOne(
      { _id: owner._id },
      { $set: { plan: input.plan, premiumExpiresAt: expiresAt } },
    );
    await this.venues.setBusinessPremiumUntil(slug, expiresAt);
    return { data: { slug, plan: input.plan, premiumExpiresAt: expiresAt } };
  }

  private effectivePlan(access: BusinessAccess): 'FREE' | 'PREMIUM' {
    return access.plan === 'PREMIUM' && access.premiumExpiresAt && access.premiumExpiresAt > new Date()
      ? 'PREMIUM'
      : 'FREE';
  }

  private async findClaim(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim not found');
    const claim = await this.claims.findById(id);
    if (!claim) throw new NotFoundException('Claim not found');
    return claim;
  }

  private publicClaim(claim: BusinessClaim & { _id: Types.ObjectId }) {
    return {
      id: claim._id.toString(),
      venueSlug: claim.venueSlug,
      status: claim.status,
      createdAt: claim.createdAt,
    };
  }
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
