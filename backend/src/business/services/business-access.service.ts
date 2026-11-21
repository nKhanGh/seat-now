import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from '../../auth/services/auth.service';
import { VenuesService } from '../../venues/services/venues.service';
import { BusinessAccess } from '../schemas/business-access.schema';
import { BusinessClaim } from '../schemas/business-claim.schema';
import { SetBusinessPlanDto } from '../dto/set-business-plan.dto';
import sharp from 'sharp';

@Injectable()
export class BusinessAccessService {
  constructor(
    @InjectModel(BusinessClaim.name) private readonly claims: Model<BusinessClaim>,
    @InjectModel(BusinessAccess.name) private readonly access: Model<BusinessAccess>,
    private readonly venues: VenuesService,
    private readonly auth: AuthService,
  ) {}

  async requestClaim(
    userId: string,
    slug: string,
    evidence: string,
    file?: { buffer: Buffer; size: number },
  ) {
    await this.venues.activeLocation(slug);
    if (await this.access.exists({ venueSlug: slug })) throw new ConflictException('Venue already managed');
    const trimmed = evidence.trim();
    if (trimmed.length < 20) throw new BadRequestException('Evidence is too short');
    const documentData = file ? await this.processClaimDocument(file) : undefined;
    const owner = new Types.ObjectId(userId);
    try {
      const claim = await this.claims.create({
        userId: owner,
        venueSlug: slug,
        evidence: trimmed,
        hasDocument: Boolean(documentData),
        documentData,
      });
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
          bookingEnabled: row.bookingEnabled ?? false,
        })),
    };
  }

  async pendingClaims() {
    const rows = await this.claims
      .find({ status: 'PENDING' })
      .sort({ createdAt: 1, _id: 1 })
      .limit(100)
      .lean();
    const users = await this.auth.adminUsersByIds(rows.map((row) => row.userId));
    const byId = new Map(users.map((user) => [user.id, user]));
    const venues = await this.venues.publicProfilesBySlugs(rows.map((row) => row.venueSlug));
    const bySlug = new Map(venues.map((venue) => [venue.slug, venue]));
    return {
      data: rows.map((row) => ({
        ...this.publicClaim(row),
        userId: row.userId.toString(),
        applicant: byId.get(row.userId.toString()) ?? null,
        venueName: bySlug.get(row.venueSlug)?.name ?? row.venueSlug,
        evidence: row.evidence,
      })),
    };
  }

  async claimDocument(id: string): Promise<Buffer> {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Claim document not found');
    const claim = await this.claims.findById(id).select('+documentData');
    if (!claim?.documentData) throw new NotFoundException('Claim document not found');
    return claim.documentData;
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
    await this.claims.updateOne(
      { _id: claim._id, status: 'PENDING' },
      { $set: { status: 'APPROVED', hasDocument: false }, $unset: { documentData: 1 } },
    );
    return { data: { id, status: 'APPROVED' } };
  }

  async rejectClaim(id: string) {
    const claim = await this.findClaim(id);
    if (claim.status !== 'PENDING') throw new ConflictException('Claim already closed');
    await this.claims.updateOne(
      { _id: claim._id, status: 'PENDING' },
      { $set: { status: 'REJECTED', hasDocument: false }, $unset: { documentData: 1 } },
    );
    return { data: { id, status: 'REJECTED' } };
  }

  async requireOwner(userId: string, slug: string, premium = false) {
    const owner = await this.access.findOne({ userId: new Types.ObjectId(userId), venueSlug: slug }).lean();
    if (!owner) throw new ForbiddenException('Venue management access required');
    if (premium && this.effectivePlan(owner) !== 'PREMIUM')
      throw new ForbiddenException('Premium business plan required');
    return owner;
  }

  async bookingStatus(slug: string) {
    if ((await this.venues.activeCategory(slug)) === 'CINEMA') return { data: { enabled: false } };
    const access = await this.access.findOne({ venueSlug: slug }, { bookingEnabled: 1 }).lean();
    return { data: { enabled: access?.bookingEnabled ?? false } };
  }

  async requireBookingEnabled(slug: string) {
    if ((await this.venues.activeCategory(slug)) === 'CINEMA')
      throw new ConflictException('Booking requests are not available for cinemas');
    if (!(await this.access.exists({ venueSlug: slug, bookingEnabled: true })))
      throw new ConflictException('Venue is not accepting booking requests');
  }

  async setBookingEnabled(userId: string, slug: string, enabled: boolean) {
    await this.requireOwner(userId, slug);
    if ((await this.venues.activeCategory(slug)) === 'CINEMA')
      throw new ConflictException('Booking requests are not available for cinemas');
    await this.access.updateOne(
      { userId: new Types.ObjectId(userId), venueSlug: slug },
      { $set: { bookingEnabled: enabled } },
    );
    return { data: { enabled } };
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

  private publicClaim(
    claim: Pick<BusinessClaim, 'venueSlug' | 'status' | 'hasDocument' | 'createdAt'> & {
      _id: Types.ObjectId;
    },
  ) {
    return {
      id: claim._id.toString(),
      venueSlug: claim.venueSlug,
      status: claim.status,
      hasDocument: claim.hasDocument ?? false,
      createdAt: claim.createdAt,
    };
  }

  private async processClaimDocument(file: { buffer: Buffer; size: number }): Promise<Buffer> {
    if (file.size < 1) throw new BadRequestException('Claim document is empty');
    if (file.size > 3_000_000) throw new PayloadTooLargeException('Claim document exceeds 3 MB');
    let processed: Buffer;
    try {
      const image = sharp(file.buffer, { failOn: 'error', limitInputPixels: 20_000_000 });
      const metadata = await image.metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? ''))
        throw new UnsupportedMediaTypeException('Only JPEG, PNG or WebP images are supported');
      processed = await image
        .rotate()
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch (error) {
      if (error instanceof UnsupportedMediaTypeException) throw error;
      throw new UnsupportedMediaTypeException('Invalid claim document image');
    }
    if (processed.length > 2_000_000)
      throw new PayloadTooLargeException('Processed claim document exceeds 2 MB');
    return processed;
  }
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
