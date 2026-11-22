import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes } from 'node:crypto';
import { Model, Types } from 'mongoose';
import { BusinessAccessService } from '../../business/services/business-access.service';
import { Venue } from '../../map/schemas/venue.schema';
import { CreateVoucherOfferDto } from '../dto/create-voucher-offer.dto';
import { VoucherClaim } from '../schemas/voucher-claim.schema';
import { VoucherOffer } from '../schemas/voucher-offer.schema';

@Injectable()
export class VoucherService {
  constructor(
    @InjectModel(VoucherOffer.name) private readonly offers: Model<VoucherOffer>,
    @InjectModel(VoucherClaim.name) private readonly claims: Model<VoucherClaim>,
    @InjectModel(Venue.name) private readonly venues: Model<Venue>,
    private readonly business: BusinessAccessService,
  ) {}

  async createOffer(input: CreateVoucherOfferDto) {
    const venue = await this.venues.findOne({ slug: input.venueSlug, status: 'ACTIVE' }, { name: 1 }).lean();
    if (!venue) throw new NotFoundException('Không tìm thấy quán đang hoạt động.');
    const now = new Date();
    const offer = await this.offers.create({
      venueSlug: input.venueSlug,
      venueName: venue.name,
      title: input.title.trim(),
      discountText: input.discountText.trim(),
      startsAt: now,
      expiresAt: new Date(now.getTime() + input.days * 24 * 60 * 60_000),
      remaining: input.stock,
      status: 'ACTIVE',
    });
    return { data: this.publicOffer(offer) };
  }

  async adminList() {
    const rows = await this.offers.find().sort({ createdAt: -1 }).limit(50).lean();
    return { data: rows.map((row) => this.publicOffer(row)) };
  }

  async deactivate(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Không tìm thấy voucher.');
    const offer = await this.offers.findOneAndUpdate(
      { _id: new Types.ObjectId(id), status: 'ACTIVE' },
      { $set: { status: 'INACTIVE' } },
      { new: true },
    );
    if (!offer) throw new ConflictException('Voucher không còn hoạt động.');
    return { data: this.publicOffer(offer) };
  }

  async available(userId: string) {
    const now = new Date();
    const rows = await this.offers
      .find({ status: 'ACTIVE', startsAt: { $lte: now }, expiresAt: { $gt: now }, remaining: { $gt: 0 } })
      .sort({ expiresAt: 1 })
      .limit(50)
      .lean();
    const claims = await this.claims
      .find({ userId: new Types.ObjectId(userId), offerId: { $in: rows.map((row) => row._id) } })
      .lean();
    const claimByOffer = new Map(claims.map((claim) => [claim.offerId.toString(), claim]));
    return {
      data: rows.map((row) => ({ ...this.publicOffer(row), claimed: claimByOffer.has(row._id.toString()) })),
    };
  }

  async mine(userId: string) {
    const claims = await this.claims
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const offers = await this.offers.find({ _id: { $in: claims.map((claim) => claim.offerId) } }).lean();
    const offerById = new Map(offers.map((offer) => [offer._id.toString(), offer]));
    return {
      data: claims.flatMap((claim) => {
        const offer = offerById.get(claim.offerId.toString());
        return offer
          ? [
              {
                id: claim._id.toString(),
                code: claim.code,
                status: claim.status,
                createdAt: claim.createdAt,
                redeemedAt: claim.redeemedAt,
                offer: this.publicOffer(offer),
              },
            ]
          : [];
      }),
    };
  }

  async claim(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Không tìm thấy voucher.');
    const userObjectId = new Types.ObjectId(userId);
    const offerId = new Types.ObjectId(id);
    if (await this.claims.exists({ userId: userObjectId, offerId }))
      throw new ConflictException('Bạn đã nhận voucher này.');
    const now = new Date();
    const offer = await this.offers.findOneAndUpdate(
      {
        _id: offerId,
        status: 'ACTIVE',
        startsAt: { $lte: now },
        expiresAt: { $gt: now },
        remaining: { $gt: 0 },
      },
      { $inc: { remaining: -1 } },
      { new: true },
    );
    if (!offer) throw new ConflictException('Voucher đã hết lượt hoặc hết hạn.');
    try {
      const claim = await this.claims.create({
        userId: userObjectId,
        offerId,
        code: `SN-${randomBytes(6).toString('hex').toUpperCase()}`,
        status: 'CLAIMED',
      });
      return { data: { code: claim.code, offer: this.publicOffer(offer) } };
    } catch (error) {
      await this.offers.updateOne({ _id: offerId }, { $inc: { remaining: 1 } });
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException('Bạn đã nhận voucher này.');
      throw error;
    }
  }

  async redeem(userId: string, venueSlug: string, code: string) {
    await this.business.requireOwner(userId, venueSlug);
    const claim = await this.claims.findOne({ code, status: 'CLAIMED' });
    if (!claim) throw new NotFoundException('Mã không tồn tại hoặc đã sử dụng.');
    const offer = await this.offers.findOne({
      _id: claim.offerId,
      venueSlug,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    });
    if (!offer) throw new ConflictException('Voucher không áp dụng cho quán này hoặc đã hết hạn.');
    const updated = await this.claims.findOneAndUpdate(
      { _id: claim._id, status: 'CLAIMED' },
      { $set: { status: 'REDEEMED', redeemedAt: new Date() } },
      { new: true },
    );
    if (!updated) throw new ConflictException('Voucher đã được sử dụng.');
    return {
      data: { code: updated.code, title: offer.title, discountText: offer.discountText, status: 'REDEEMED' },
    };
  }

  private publicOffer(offer: VoucherOffer & { _id: Types.ObjectId }) {
    return {
      id: offer._id.toString(),
      venueSlug: offer.venueSlug,
      venueName: offer.venueName,
      title: offer.title,
      discountText: offer.discountText,
      startsAt: offer.startsAt,
      expiresAt: offer.expiresAt,
      remaining: offer.remaining,
      status: offer.status,
    };
  }
}
