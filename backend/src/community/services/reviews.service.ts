import { BadRequestException, ForbiddenException, Injectable, NotFoundException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthService } from '../../auth/services/auth.service';
import { VenuesService } from '../../venues/services/venues.service';
import { UpsertReviewDto } from '../dto/review.dto';
import { Review } from '../schemas/review.schema';
import { ReviewPhoto } from '../schemas/review-photo.schema';
import sharp from 'sharp';

const PAGE_SIZE = 20;

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
    @InjectModel(ReviewPhoto.name) private readonly photos: Model<ReviewPhoto>,
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
    const [authors, photos] = await Promise.all([
      this.auth.publicUsersByIds(page.map((row) => row.userId)),
      this.photos.find({ reviewId: { $in: page.map((row) => row._id) } }, { reviewId: 1 }).lean(),
    ]);
    const byId = new Map(authors.map((user) => [user.id, user.displayName]));
    const photoIds = new Set(photos.map((photo) => photo.reviewId.toString()));
    const last = page.at(-1);
    return {
      data: page.map((row) => ({
        id: row._id.toString(), rating: row.rating, body: row.body,
        author: { id: row.userId.toString(), displayName: byId.get(row.userId.toString()) ?? 'Thành viên SeatNow' },
        createdAt: row.createdAt, updatedAt: row.updatedAt,
        photoUrl: photoIds.has(row._id.toString()) ? `/api/v1/reviews/${row._id.toString()}/photo` : null,
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
    const existing = await this.reviews.findOne({ userId: new Types.ObjectId(userId), venueSlug: slug }, { status: 1 }).lean();
    if (existing?.status === 'HIDDEN') throw new ForbiddenException({ code: 'REVIEW_HIDDEN', message: 'Review is hidden' });
    const review = await this.reviews.findOneAndUpdate(
      { userId: new Types.ObjectId(userId), venueSlug: slug },
      { $set: { rating: input.rating, body } },
      { upsert: true, new: true },
    ).lean();
    return { data: { id: review!._id.toString(), rating: review!.rating, body: review!.body, updatedAt: review!.updatedAt } };
  }

  async remove(userId: string, slug: string) {
    const review = await this.reviews.findOneAndDelete({ userId: new Types.ObjectId(userId), venueSlug: slug });
    if (review) await this.photos.deleteOne({ reviewId: review._id });
    return { data: { deleted: true } };
  }

  async uploadPhoto(userId: string, slug: string, file: { buffer: Buffer; size: number } | undefined) {
    if (!file || file.size < 1) throw new BadRequestException({ code: 'PHOTO_REQUIRED', message: 'Photo is required' });
    if (file.size > 2_000_000) throw new PayloadTooLargeException({ code: 'PHOTO_TOO_LARGE', message: 'Photo exceeds 2 MB' });
    const review = await this.reviews.findOne({ userId: new Types.ObjectId(userId), venueSlug: slug, status: 'PUBLISHED' });
    if (!review) throw new NotFoundException('Published review not found');
    let processed: Buffer;
    try {
      const image = sharp(file.buffer, { failOn: 'error', limitInputPixels: 20_000_000 });
      const metadata = await image.metadata();
      if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '')) throw new UnsupportedMediaTypeException('Only JPEG, PNG or WebP photos are supported');
      processed = await image.rotate().resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    } catch (error) {
      if (error instanceof UnsupportedMediaTypeException) throw error;
      throw new UnsupportedMediaTypeException({ code: 'PHOTO_INVALID', message: 'Invalid image file' });
    }
    if (processed.length > 2_000_000) throw new PayloadTooLargeException({ code: 'PHOTO_TOO_LARGE', message: 'Processed photo exceeds 2 MB' });
    await this.photos.updateOne({ reviewId: review._id }, { $set: { data: processed, contentType: 'image/webp' } }, { upsert: true });
    return { data: { photoUrl: `/api/v1/reviews/${review._id.toString()}/photo` } };
  }

  async getPhoto(id: string): Promise<Buffer> {
    if (!/^[a-f0-9]{24}$/.test(id)) throw new NotFoundException('Photo not found');
    const review = await this.reviews.findOne({ _id: new Types.ObjectId(id), status: 'PUBLISHED' }, { _id: 1 });
    if (!review) throw new NotFoundException('Photo not found');
    const photo = await this.photos.findOne({ reviewId: review._id });
    if (!photo) throw new NotFoundException('Photo not found');
    return photo.data;
  }
}
