import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from '../../auth/services/auth.service';
import { VenuesService } from '../../venues/services/venues.service';
import { UpsertReviewDto } from '../dto/review.dto';
import { Review } from '../schemas/review.schema';

const PAGE_SIZE = 20;

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
    private readonly venues: VenuesService,
    private readonly auth: AuthService,
  ) {}

  async list(slug: string, encodedCursor?: string) {
    await this.venues.activeLocation(slug);
    let cursor: { createdAt: Date; id: Types.ObjectId } | null = null;
    if (encodedCursor) {
      try {
        const parsed = JSON.parse(Buffer.from(encodedCursor, 'base64url').toString('utf8')) as Record<string, unknown>;
        if (parsed.slug !== slug || typeof parsed.createdAt !== 'string' || typeof parsed.id !== 'string'
          || !/^[a-f0-9]{24}$/.test(parsed.id) || !Number.isFinite(Date.parse(parsed.createdAt))) throw new Error('invalid');
        cursor = { createdAt: new Date(parsed.createdAt), id: new Types.ObjectId(parsed.id) };
      } catch { throw new BadRequestException({ code: 'REVIEW_INVALID_CURSOR', message: 'Invalid review cursor' }); }
    }
    const filter: Record<string, unknown> = { venueSlug: slug, status: 'PUBLISHED' };
    if (cursor) filter.$or = [
      { createdAt: { $lt: cursor.createdAt } },
      { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
    ];
    const rows = await this.reviews.find(filter).sort({ createdAt: -1, _id: -1 }).limit(PAGE_SIZE + 1).lean();
    const page = rows.slice(0, PAGE_SIZE);
    const authors = await this.auth.publicUsersByIds(page.map((row) => row.userId));
    const byId = new Map(authors.map((user) => [user.id, user.displayName]));
    const last = page.at(-1);
    return {
      data: page.map((row) => ({
        id: row._id.toString(), rating: row.rating, body: row.body,
        author: { id: row.userId.toString(), displayName: byId.get(row.userId.toString()) ?? 'Thành viên SeatNow' },
        createdAt: row.createdAt, updatedAt: row.updatedAt,
      })),
      meta: { nextCursor: rows.length > PAGE_SIZE && last
        ? Buffer.from(JSON.stringify({ slug, createdAt: last.createdAt.toISOString(), id: last._id.toString() })).toString('base64url')
        : null },
    };
  }

  async upsert(userId: string, slug: string, input: UpsertReviewDto) {
    await this.venues.activeLocation(slug);
    const body = input.body.trim();
    if (body.length < 10) throw new BadRequestException({ code: 'REVIEW_TOO_SHORT', message: 'Review is too short' });
    const review = await this.reviews.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), venueSlug: slug },
      { $set: { rating: input.rating, body, status: 'PUBLISHED' } },
      { upsert: true, new: true },
    ).lean();
    return { data: { id: review!._id.toString(), rating: review!.rating, body: review!.body, updatedAt: review!.updatedAt } };
  }

  async remove(userId: string, slug: string) {
    await this.reviews.deleteOne({ userId: new Types.ObjectId(userId), venueSlug: slug });
    return { data: { deleted: true } };
  }
}
