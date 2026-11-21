import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessAccessService } from '../../business/services/business-access.service';
import { AuthService } from '../../auth/services/auth.service';
import { EntitlementService } from '../../subscription/services/entitlement.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { Booking } from '../schemas/booking.schema';
import { Venue } from '../../map/schemas/venue.schema';
import { AvailabilityLatest } from '../../availability/schemas/availability-snapshot.schema';

const MAX_BOOKING_MINUTES = 4 * 60;
const LEGACY_BOOKING_MINUTES = 2 * 60;

function bookingEndsAt(row: Pick<Booking, 'requestedAt' | 'endsAt'>) {
  return row.endsAt ?? new Date(row.requestedAt.getTime() + LEGACY_BOOKING_MINUTES * 60_000);
}

@Injectable()
export class BookingService {
  private readonly confirmationLocks = new Map<string, Promise<void>>();

  constructor(
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Venue.name) private readonly venues: Model<Venue>,
    @InjectModel(AvailabilityLatest.name) private readonly availability: Model<AvailabilityLatest>,
    private readonly business: BusinessAccessService,
    private readonly entitlements: EntitlementService,
    private readonly auth: AuthService,
  ) {}

  bookingStatus(slug: string) {
    return this.business.bookingStatus(slug);
  }

  setBookingEnabled(userId: string, slug: string, enabled: boolean) {
    return this.business.setBookingEnabled(userId, slug, enabled);
  }

  async create(userId: string, slug: string, input: CreateBookingDto) {
    const requestedAt = new Date(input.requestedAt);
    const endsAt = new Date(input.endsAt);
    const now = Date.now();
    if (requestedAt.getTime() < now + 60 * 60_000 || requestedAt.getTime() > now + 14 * 24 * 60 * 60_000)
      throw new BadRequestException('Booking time must be between one hour and fourteen days ahead');
    const duration = endsAt.getTime() - requestedAt.getTime();
    if (!Number.isFinite(duration) || duration < 30 * 60_000 || duration > MAX_BOOKING_MINUTES * 60_000)
      throw new BadRequestException('Booking duration must be between 30 minutes and four hours');
    await this.business.requireBookingEnabled(slug);
    const priority = await this.entitlements.can(userId, 'booking.priority');
    try {
      const booking = await this.bookings.create({
        userId: new Types.ObjectId(userId),
        venueSlug: slug,
        requestedAt,
        endsAt,
        guestCount: input.guestCount,
        note: input.note?.trim() ?? '',
        priority,
      });
      return { data: this.publicBooking(booking) };
    } catch (error) {
      if (isDuplicate(error)) throw new ConflictException('Booking request already exists for this time');
      throw error;
    }
  }

  async mine(userId: string) {
    const rows = await this.bookings
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1, _id: -1 })
      .limit(100)
      .lean();
    const venueRows = await this.venues
      .find({ slug: { $in: [...new Set(rows.map((row) => row.venueSlug))] } })
      .select({ slug: 1, name: 1, location: 1 })
      .lean();
    const venueBySlug = new Map(venueRows.map((venue) => [venue.slug, venue]));
    return {
      data: rows.map((row) => {
        const venue = venueBySlug.get(row.venueSlug);
        return {
          ...this.publicBooking(row),
          venueName: venue?.name ?? row.venueSlug,
          venueLocation: venue?.location ?? null,
        };
      }),
    };
  }

  async forVenue(userId: string, slug: string) {
    await this.business.requireOwner(userId, slug);
    const rows = await this.bookings
      .find({
        venueSlug: slug,
        $or: [
          { status: 'PENDING', requestedAt: { $gte: new Date(Date.now() - 2 * 60 * 60_000) } },
          { status: 'CONFIRMED', requestedAt: { $gte: new Date(Date.now() - 24 * 60 * 60_000) } },
        ],
      })
      .sort({ status: -1, priority: -1, requestedAt: 1, _id: 1 })
      .limit(100)
      .lean();
    const users = await this.auth.publicUsersByIds(rows.map((row) => row.userId));
    const names = new Map(users.map((user) => [user.id, user.displayName]));
    return {
      data: rows.map((row) => ({
        ...this.publicBooking(row),
        guestDisplayName: names.get(row.userId.toString()) ?? 'Tài khoản không còn hoạt động',
      })),
    };
  }

  async cancel(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Booking request not found');
    const row = await this.bookings
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          userId: new Types.ObjectId(userId),
          status: { $in: ['PENDING', 'CONFIRMED'] },
        },
        { $set: { status: 'CANCELED', resolvedAt: new Date() } },
        { new: true },
      )
      .lean();
    if (!row) throw new ConflictException('Booking request cannot be canceled');
    return { data: this.publicBooking(row) };
  }

  async resolve(userId: string, slug: string, id: string, status: 'CONFIRMED' | 'DECLINED' | 'COMPLETED') {
    await this.business.requireOwner(userId, slug);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Booking request not found');
    if (status === 'CONFIRMED')
      return this.withConfirmationLock(slug, async () => {
        const request = await this.bookings.findOne({
          _id: new Types.ObjectId(id),
          venueSlug: slug,
          status: 'PENDING',
        });
        if (!request) throw new ConflictException('Booking request cannot change to this status');
        await this.requireCapacity(slug, request);
        return this.changeStatus(slug, id, status);
      });
    return this.changeStatus(slug, id, status);
  }

  private async requireCapacity(slug: string, request: Booking) {
    const snapshot = await this.availability.findOne({ slug }, { tables: 1, seats: 1 }).lean();
    if (!snapshot?.tables && !snapshot?.seats) return;
    const start = request.requestedAt.getTime();
    const end = bookingEndsAt(request).getTime();
    const candidates = await this.bookings
      .find({
        venueSlug: slug,
        status: { $in: ['CONFIRMED', 'COMPLETED'] },
        requestedAt: {
          $lt: new Date(end),
          $gte: new Date(start - MAX_BOOKING_MINUTES * 60_000),
        },
      })
      .select({ requestedAt: 1, endsAt: 1, guestCount: 1 })
      .lean();
    const overlapping = candidates.filter((row) => bookingEndsAt(row).getTime() > start);
    if (snapshot.tables && overlapping.length >= snapshot.tables.total)
      throw new ConflictException('Không còn bàn cho khung giờ này. Hãy từ chối yêu cầu hoặc chọn giờ khác.');
    if (
      snapshot.seats &&
      overlapping.reduce((sum, row) => sum + row.guestCount, request.guestCount) > snapshot.seats.total
    )
      throw new ConflictException('Không đủ ghế cho khung giờ này. Hãy từ chối yêu cầu hoặc chọn giờ khác.');
  }

  private async withConfirmationLock<T>(slug: string, action: () => Promise<T>): Promise<T> {
    const previous = this.confirmationLocks.get(slug);
    let release!: () => void;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.confirmationLocks.set(slug, current);
    if (previous) await previous;
    try {
      return await action();
    } finally {
      release();
      if (this.confirmationLocks.get(slug) === current) this.confirmationLocks.delete(slug);
    }
  }

  private async changeStatus(slug: string, id: string, status: 'CONFIRMED' | 'DECLINED' | 'COMPLETED') {
    const row = await this.bookings
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          venueSlug: slug,
          status: status === 'COMPLETED' ? 'CONFIRMED' : 'PENDING',
        },
        {
          $set:
            status === 'COMPLETED' ? { status, completedAt: new Date() } : { status, resolvedAt: new Date() },
        },
        { new: true },
      )
      .lean();
    if (!row) throw new ConflictException('Booking request cannot change to this status');
    return { data: this.publicBooking(row) };
  }

  private publicBooking(row: Booking & { _id: Types.ObjectId }) {
    return {
      id: row._id.toString(),
      venueSlug: row.venueSlug,
      requestedAt: row.requestedAt,
      endsAt: bookingEndsAt(row),
      guestCount: row.guestCount,
      note: row.note,
      priority: row.priority,
      status: row.status,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
      completedAt: row.completedAt,
    };
  }
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
