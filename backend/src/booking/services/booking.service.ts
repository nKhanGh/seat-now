import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessAccessService } from '../../business/services/business-access.service';
import { AuthService } from '../../auth/services/auth.service';
import { EntitlementService } from '../../subscription/services/entitlement.service';
import { CreateBookingDto } from '../dto/create-booking.dto';
import { Booking } from '../schemas/booking.schema';
import { Venue } from '../../map/schemas/venue.schema';

@Injectable()
export class BookingService {
  constructor(
    @InjectModel(Booking.name) private readonly bookings: Model<Booking>,
    @InjectModel(Venue.name) private readonly venues: Model<Venue>,
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
    const now = Date.now();
    if (requestedAt.getTime() < now + 60 * 60_000 || requestedAt.getTime() > now + 14 * 24 * 60 * 60_000)
      throw new BadRequestException('Booking time must be between one hour and fourteen days ahead');
    await this.business.requireBookingEnabled(slug);
    const priority = await this.entitlements.can(userId, 'booking.priority');
    try {
      const booking = await this.bookings.create({
        userId: new Types.ObjectId(userId),
        venueSlug: slug,
        requestedAt,
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
        status: { $in: ['PENDING', 'CONFIRMED'] },
        requestedAt: { $gte: new Date(Date.now() - 2 * 60 * 60_000) },
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

  async resolve(userId: string, slug: string, id: string, status: 'CONFIRMED' | 'DECLINED') {
    await this.business.requireOwner(userId, slug);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Booking request not found');
    const row = await this.bookings
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), venueSlug: slug, status: 'PENDING' },
        { $set: { status, resolvedAt: new Date() } },
        { new: true },
      )
      .lean();
    if (!row) throw new ConflictException('Booking request is no longer pending');
    return { data: this.publicBooking(row) };
  }

  private publicBooking(row: Booking & { _id: Types.ObjectId }) {
    return {
      id: row._id.toString(),
      venueSlug: row.venueSlug,
      requestedAt: row.requestedAt,
      guestCount: row.guestCount,
      note: row.note,
      priority: row.priority,
      status: row.status,
      createdAt: row.createdAt,
      resolvedAt: row.resolvedAt,
    };
  }
}

function isDuplicate(error: unknown): error is { code: number } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}
