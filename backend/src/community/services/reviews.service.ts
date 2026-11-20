import {
  BadRequestException,
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
import { UpsertReviewDto } from '../dto/review.dto';
import { Review } from '../schemas/review.schema';
import { ReviewPhoto } from '../schemas/review-photo.schema';
import { ReviewReport } from '../schemas/review-report.schema';
import { Venue } from '../../map/schemas/venue.schema';
import sharp from 'sharp';

const PAGE_SIZE = 20;

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
    @InjectModel(ReviewPhoto.name) private readonly photos: Model<ReviewPhoto>,
    @InjectModel(ReviewReport.name) private readonly reports: Model<ReviewReport>,
    @InjectModel(Venue.name) private readonly venueModel: Model<Venue>,
    private readonly venues: VenuesService,
    private readonly auth: AuthService,
  ) {}

  async list(slug: string, encodedCursor?: string) {
    await this.venues.activeLocation(slug);
    let cursor: { createdAt: Date; id: Types.ObjectId } | null = null;
    if (encodedCursor) {
      try {
        const parsed = JSON.parse(Buffer.from(encodedCursor, 'base64url').toString('utf8')) as Record<
          string,
          unknown
        >;
        if (
          parsed.slug !== slug ||
          typeof parsed.createdAt !== 'string' ||
          typeof parsed.id !== 'string' ||
          !/^[a-f0-9]{24}$/.test(parsed.id) ||
          !Number.isFinite(Date.parse(parsed.createdAt))
        )
          throw new Error('invalid');
        cursor = { createdAt: new Date(parsed.createdAt), id: new Types.ObjectId(parsed.id) };
      } catch {
        throw new BadRequestException({ code: 'REVIEW_INVALID_CURSOR', message: 'Invalid review cursor' });
      }
    }
    const filter: Record<string, unknown> = { venueSlug: slug, status: 'PUBLISHED' };
    if (cursor)
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    const rows = await this.reviews
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(PAGE_SIZE + 1)
      .lean();
    const page = rows.slice(0, PAGE_SIZE);
    const [authors, photos] = await Promise.all([
      this.auth.publicUsersByIds(page.map((row) => row.userId)),
      this.photos.find({ reviewId: { $in: page.map((row) => row._id) } }, { reviewId: 1 }).lean(),
    ]);
    const byId = new Map(authors.map((user) => [user.id, user.displayName]));
    const photoIds = new Set(photos.map((photo) => photo.reviewId.toString()));
    const last = page.at(-1);
    return {
      data: page.map((row) => ({
        id: row._id.toString(),
        rating: row.rating,
        body: row.body,
        author: {
          id: row.userId.toString(),
          displayName: byId.get(row.userId.toString()) ?? 'Thành viên SeatNow',
        },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        photoUrl: photoIds.has(row._id.toString()) ? `/api/v1/reviews/${row._id.toString()}/photo` : null,
      })),
      meta: {
        nextCursor:
          rows.length > PAGE_SIZE && last
            ? Buffer.from(
                JSON.stringify({ slug, createdAt: last.createdAt.toISOString(), id: last._id.toString() }),
              ).toString('base64url')
            : null,
      },
    };
  }

  async listByUser(userId: string, encodedCursor?: string) {
    await this.auth.publicProfileById(userId);
    let cursor: { createdAt: Date; id: Types.ObjectId } | null = null;
    if (encodedCursor) {
      try {
        const parsed = JSON.parse(Buffer.from(encodedCursor, 'base64url').toString('utf8')) as Record<
          string,
          unknown
        >;
        if (
          parsed.userId !== userId ||
          typeof parsed.createdAt !== 'string' ||
          typeof parsed.id !== 'string' ||
          !/^[a-f0-9]{24}$/.test(parsed.id) ||
          !Number.isFinite(Date.parse(parsed.createdAt))
        )
          throw new Error('invalid');
        cursor = { createdAt: new Date(parsed.createdAt), id: new Types.ObjectId(parsed.id) };
      } catch {
        throw new BadRequestException({ code: 'REVIEW_INVALID_CURSOR', message: 'Invalid review cursor' });
      }
    }
    const filter: Record<string, unknown> = { userId: new Types.ObjectId(userId), status: 'PUBLISHED' };
    if (cursor)
      filter.$or = [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor.id } },
      ];
    const rows = await this.reviews
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(PAGE_SIZE + 1)
      .lean();
    const page = rows.slice(0, PAGE_SIZE);
    const [photos, venues] = await Promise.all([
      this.photos.find({ reviewId: { $in: page.map((row) => row._id) } }, { reviewId: 1 }).lean(),
      this.venueModel
        .find({ slug: { $in: page.map((row) => row.venueSlug) }, status: 'ACTIVE' })
        .select({ slug: 1, name: 1, location: 1 })
        .lean(),
    ]);
    const photoIds = new Set(photos.map((photo) => photo.reviewId.toString()));
    const venueBySlug = new Map(venues.map((venue) => [venue.slug, venue]));
    const last = page.at(-1);
    return {
      data: page.map((row) => {
        const venue = venueBySlug.get(row.venueSlug);
        return {
          id: row._id.toString(),
          venueSlug: row.venueSlug,
          venueName: venue?.name ?? row.venueSlug,
          venueLocation: venue?.location ?? null,
          rating: row.rating,
          body: row.body,
          createdAt: row.createdAt,
          photoUrl: photoIds.has(row._id.toString()) ? `/api/v1/reviews/${row._id.toString()}/photo` : null,
        };
      }),
      meta: {
        nextCursor:
          rows.length > PAGE_SIZE && last
            ? Buffer.from(
                JSON.stringify({ userId, createdAt: last.createdAt.toISOString(), id: last._id.toString() }),
              ).toString('base64url')
            : null,
      },
    };
  }

  async mine(userId: string, slug: string) {
    const review = await this.reviews
      .findOne({ userId: new Types.ObjectId(userId), venueSlug: slug, status: 'PUBLISHED' })
      .lean();
    if (!review) return { data: null };
    const photo = await this.photos.exists({ reviewId: review._id });
    return {
      data: {
        id: review._id.toString(),
        rating: review.rating,
        body: review.body,
        photoUrl: photo ? `/api/v1/reviews/${review._id.toString()}/photo` : null,
      },
    };
  }

  async listForUsers(userIds: Types.ObjectId[]) {
    if (userIds.length === 0) return { data: [], meta: { truncated: false } };
    const rows = await this.reviews
      .find({ userId: { $in: userIds }, status: 'PUBLISHED' })
      .sort({ createdAt: -1, _id: -1 })
      .limit(PAGE_SIZE + 1)
      .lean();
    const page = rows.slice(0, PAGE_SIZE);
    const [authors, photos, venues] = await Promise.all([
      this.auth.publicUsersByIds(page.map((row) => row.userId)),
      this.photos.find({ reviewId: { $in: page.map((row) => row._id) } }, { reviewId: 1 }).lean(),
      this.venueModel
        .find({ slug: { $in: page.map((row) => row.venueSlug) }, status: 'ACTIVE' })
        .select({ slug: 1, name: 1, location: 1 })
        .lean(),
    ]);
    const authorById = new Map(authors.map((author) => [author.id, author.displayName]));
    const photoIds = new Set(photos.map((photo) => photo.reviewId.toString()));
    const venueBySlug = new Map(venues.map((venue) => [venue.slug, venue]));
    return {
      data: page.map((row) => {
        const venue = venueBySlug.get(row.venueSlug);
        return {
          id: row._id.toString(),
          author: {
            id: row.userId.toString(),
            displayName: authorById.get(row.userId.toString()) ?? 'Thành viên SeatNow',
          },
          venueSlug: row.venueSlug,
          venueName: venue?.name ?? row.venueSlug,
          venueLocation: venue?.location ?? null,
          rating: row.rating,
          body: row.body,
          createdAt: row.createdAt,
          photoUrl: photoIds.has(row._id.toString()) ? `/api/v1/reviews/${row._id.toString()}/photo` : null,
        };
      }),
      meta: { truncated: rows.length > PAGE_SIZE },
    };
  }

  async upsert(userId: string, slug: string, input: UpsertReviewDto) {
    await this.venues.activeLocation(slug);
    const body = input.body?.trim() ?? '';
    const existing = await this.reviews
      .findOne({ userId: new Types.ObjectId(userId), venueSlug: slug }, { status: 1 })
      .lean();
    if (existing?.status === 'HIDDEN')
      throw new ForbiddenException({ code: 'REVIEW_HIDDEN', message: 'Review is hidden' });
    const review = await this.reviews
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId), venueSlug: slug },
        { $set: { rating: input.rating, body } },
        { upsert: true, new: true },
      )
      .lean();
    await this.refreshRating(slug);
    return {
      data: {
        id: review._id.toString(),
        rating: review.rating,
        body: review.body,
        updatedAt: review.updatedAt,
      },
    };
  }

  async remove(userId: string, slug: string) {
    const owner = { userId: new Types.ObjectId(userId), venueSlug: slug };
    const existing = await this.reviews.findOne(owner);
    if (existing?.status === 'HIDDEN') {
      await this.reviews.updateOne(
        { _id: existing._id, status: 'HIDDEN' },
        { $set: { body: 'Review đã xóa.' } },
      );
    }
    const review =
      existing?.status === 'HIDDEN'
        ? existing
        : await this.reviews.findOneAndDelete({ ...owner, status: 'PUBLISHED' });
    if (review)
      await Promise.all([
        this.photos.deleteOne({ reviewId: review._id }),
        this.reports.deleteMany({ reviewId: review._id }),
      ]);
    if (review) await this.refreshRating(slug);
    return { data: { deleted: true } };
  }

  async report(userId: string, id: string, reason: 'SPAM' | 'ABUSE' | 'OTHER') {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Review not found');
    const reviewId = new Types.ObjectId(id);
    const review = await this.reviews.findOne({ _id: reviewId, status: 'PUBLISHED' }, { userId: 1 }).lean();
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId.toString() === userId) throw new BadRequestException('Cannot report your own review');
    const reporterId = new Types.ObjectId(userId);
    try {
      await this.reports.updateOne({ reviewId, reporterId }, { $setOnInsert: { reason } }, { upsert: true });
    } catch (error) {
      if (!(typeof error === 'object' && error !== null && 'code' in error && error.code === 11000))
        throw error;
    }
    return { data: { reported: true } };
  }

  async pendingReports() {
    const rows = await this.reports.aggregate<{ _id: Types.ObjectId; count: number; latestAt: Date }>([
      { $group: { _id: '$reviewId', count: { $sum: 1 }, latestAt: { $max: '$createdAt' } } },
      { $sort: { latestAt: -1 } },
      { $limit: 100 },
    ]);
    const published = await this.reviews
      .find(
        { _id: { $in: rows.map((row) => row._id) }, status: 'PUBLISHED' },
        { venueSlug: 1, body: 1, rating: 1 },
      )
      .lean();
    const byId = new Map(published.map((row) => [row._id.toString(), row]));
    return {
      data: rows
        .filter((row) => byId.has(row._id.toString()))
        .map((row) => ({
          reviewId: row._id.toString(),
          venueSlug: byId.get(row._id.toString())!.venueSlug,
          body: byId.get(row._id.toString())!.body,
          rating: byId.get(row._id.toString())!.rating,
          reportCount: row.count,
          latestAt: row.latestAt,
        })),
    };
  }

  async hide(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Review not found');
    const review = await this.reviews.findByIdAndUpdate(id, { $set: { status: 'HIDDEN' } }, { new: true });
    if (!review) throw new NotFoundException('Review not found');
    await this.refreshRating(review.venueSlug);
    return { data: { id, status: 'HIDDEN' } };
  }

  private async refreshRating(slug: string) {
    const [summary] = await this.reviews.aggregate<{ average: number }>([
      { $match: { venueSlug: slug, status: 'PUBLISHED' } },
      { $group: { _id: null, average: { $avg: '$rating' } } },
    ]);
    await this.venues.updateCommunityRating(slug, summary ? Math.round(summary.average * 10) / 10 : 0);
  }

  async uploadPhoto(userId: string, slug: string, file: { buffer: Buffer; size: number } | undefined) {
    if (!file || file.size < 1)
      throw new BadRequestException({ code: 'PHOTO_REQUIRED', message: 'Photo is required' });
    if (file.size > 2_000_000)
      throw new PayloadTooLargeException({ code: 'PHOTO_TOO_LARGE', message: 'Photo exceeds 2 MB' });
    const review = await this.reviews.findOne({
      userId: new Types.ObjectId(userId),
      venueSlug: slug,
      status: 'PUBLISHED',
    });
    if (!review) throw new NotFoundException('Published review not found');
    let processed: Buffer;
    try {
      const image = sharp(file.buffer, { failOn: 'error', limitInputPixels: 20_000_000 });
      const metadata = await image.metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? ''))
        throw new UnsupportedMediaTypeException('Only JPEG, PNG or WebP photos are supported');
      processed = await image
        .rotate()
        .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (error) {
      if (error instanceof UnsupportedMediaTypeException) throw error;
      throw new UnsupportedMediaTypeException({ code: 'PHOTO_INVALID', message: 'Invalid image file' });
    }
    if (processed.length > 2_000_000)
      throw new PayloadTooLargeException({
        code: 'PHOTO_TOO_LARGE',
        message: 'Processed photo exceeds 2 MB',
      });
    await this.photos.updateOne(
      { reviewId: review._id },
      { $set: { data: processed, contentType: 'image/webp' } },
      { upsert: true },
    );
    return { data: { photoUrl: `/api/v1/reviews/${review._id.toString()}/photo` } };
  }

  async getPhoto(id: string): Promise<Buffer> {
    if (!/^[a-f0-9]{24}$/.test(id)) throw new NotFoundException('Photo not found');
    const review = await this.reviews.findOne(
      { _id: new Types.ObjectId(id), status: 'PUBLISHED' },
      { _id: 1 },
    );
    if (!review) throw new NotFoundException('Photo not found');
    const photo = await this.photos.findOne({ reviewId: review._id });
    if (!photo) throw new NotFoundException('Photo not found');
    return photo.data;
  }
}
