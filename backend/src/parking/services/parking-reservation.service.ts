import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { BusinessAccessService } from '../../business/services/business-access.service';
import { CreateParkingReservationDto } from '../dto/create-parking-reservation.dto';
import { ParkingFacility } from '../schemas/parking-facility.schema';
import { ParkingReservation } from '../schemas/parking-reservation.schema';
import { UpdateParkingAvailabilityDto } from '../dto/update-parking-availability.dto';
import { ParkingService } from './parking.service';

@Injectable()
export class ParkingReservationService {
  private readonly confirmationLocks = new Map<string, Promise<void>>();

  constructor(
    @InjectModel(ParkingReservation.name) private readonly reservations: Model<ParkingReservation>,
    @InjectModel(ParkingFacility.name) private readonly facilities: Model<ParkingFacility>,
    private readonly business: BusinessAccessService,
    private readonly parking: ParkingService,
  ) {}

  async ownedFacilities(userId: string, venueSlug: string) {
    await this.business.requireOwner(userId, venueSlug);
    const rows = await this.facilities
      .find({ venueSlugs: venueSlug, kind: 'VENUE', status: 'ACTIVE' })
      .sort({ name: 1 })
      .lean();
    return {
      data: rows.map((row) => ({
        slug: row.slug,
        name: row.name,
        totalSpaces: row.totalSpaces,
        availableSpaces: row.availableSpaces,
        expiresAt: row.availabilityExpiresAt,
      })),
    };
  }

  async updateAvailability(
    userId: string,
    venueSlug: string,
    facilitySlug: string,
    input: UpdateParkingAvailabilityDto,
  ) {
    await this.business.requireOwner(userId, venueSlug);
    if (input.availableSpaces > input.totalSpaces)
      throw new BadRequestException('Số chỗ trống không thể vượt tổng số chỗ.');
    const facility = await this.facilities
      .findOne({ slug: facilitySlug, venueSlugs: venueSlug, kind: 'VENUE', status: 'ACTIVE' })
      .lean();
    if (!facility) throw new NotFoundException('Không tìm thấy bãi của quán.');
    const now = new Date();
    const version = Math.max(now.getTime(), (facility.availabilityVersion ?? 0) + 1);
    const result = await this.parking.ingest(facilitySlug, {
      version,
      totalSpaces: input.totalSpaces,
      availableSpaces: input.availableSpaces,
      source: 'OPERATOR',
      sourceRecordId: `${facilitySlug}:${version}`,
      confidence: 0.8,
      capturedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 10 * 60_000).toISOString(),
    });
    if (!result.latestUpdated) throw new ConflictException('Dữ liệu bãi xe vừa thay đổi. Hãy thử lưu lại.');
    return { data: { facilitySlug, totalSpaces: input.totalSpaces, availableSpaces: input.availableSpaces } };
  }

  async create(userId: string, venueSlug: string, facilitySlug: string, input: CreateParkingReservationDto) {
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);
    const now = Date.now();
    if (startsAt.getTime() < now + 15 * 60_000 || startsAt.getTime() > now + 2 * 60 * 60_000)
      throw new BadRequestException('Giờ đến phải trong khoảng 15 phút đến 2 giờ tới.');
    const duration = endsAt.getTime() - startsAt.getTime();
    if (!Number.isFinite(duration) || duration < 30 * 60_000 || duration > 3 * 60 * 60_000)
      throw new BadRequestException('Thời gian gửi xe phải từ 30 phút đến 3 giờ.');
    const facility = await this.facilities
      .findOne({ slug: facilitySlug, status: 'ACTIVE', kind: 'VENUE', venueSlugs: venueSlug })
      .lean();
    if (!facility) throw new NotFoundException('Bãi của quán không hỗ trợ yêu cầu giữ chỗ.');
    if (!facility.vehicleTypes.includes(input.vehicleType))
      throw new BadRequestException('Bãi không nhận loại xe này.');
    if (
      !facility.availabilityExpiresAt ||
      facility.availabilityExpiresAt.getTime() <= now ||
      !facility.availableSpaces ||
      facility.availableSpaces <= 0
    )
      throw new ConflictException('Bãi đang hết chỗ hoặc chưa có dữ liệu chỗ trống mới.');
    const userObjectId = new Types.ObjectId(userId);
    const existing = await this.reservations.exists({
      userId: userObjectId,
      facilitySlug,
      status: { $in: ['PENDING', 'CONFIRMED'] },
      startsAt: { $lt: endsAt },
      endsAt: { $gt: startsAt },
    });
    if (existing) throw new ConflictException('Bạn đã có yêu cầu giữ xe trùng khung giờ tại bãi này.');
    try {
      const row = await this.reservations.create({
        userId: userObjectId,
        venueSlug,
        facilitySlug,
        vehicleType: input.vehicleType,
        startsAt,
        endsAt,
        status: 'PENDING',
      });
      return { data: this.publicReservation(row) };
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException('Yêu cầu giữ xe đã tồn tại.');
      throw error;
    }
  }

  async mine(userId: string) {
    const rows = await this.reservations
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const facilities = await this.facilities
      .find({ slug: { $in: rows.map((row) => row.facilitySlug) } }, { slug: 1, name: 1 })
      .lean();
    const names = new Map(facilities.map((facility) => [facility.slug, facility.name]));
    return {
      data: rows.map((row) => ({
        ...this.publicReservation(row),
        facilityName: names.get(row.facilitySlug) ?? row.facilitySlug,
      })),
    };
  }

  async forVenue(userId: string, venueSlug: string) {
    await this.business.requireOwner(userId, venueSlug);
    const rows = await this.reservations
      .find({
        venueSlug,
        startsAt: { $gte: new Date(Date.now() - 3 * 60 * 60_000) },
        status: { $in: ['PENDING', 'CONFIRMED'] },
      })
      .sort({ status: -1, startsAt: 1 })
      .limit(100)
      .lean();
    const facilities = await this.facilities
      .find({ slug: { $in: rows.map((row) => row.facilitySlug) } }, { slug: 1, name: 1 })
      .lean();
    const names = new Map(facilities.map((facility) => [facility.slug, facility.name]));
    return {
      data: rows.map((row) => ({
        ...this.publicReservation(row),
        facilityName: names.get(row.facilitySlug) ?? row.facilitySlug,
      })),
    };
  }

  async cancel(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Không tìm thấy yêu cầu giữ xe.');
    const row = await this.reservations.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
        status: { $in: ['PENDING', 'CONFIRMED'] },
        startsAt: { $gt: new Date() },
      },
      { $set: { status: 'CANCELED', resolvedAt: new Date() } },
      { new: true },
    );
    if (!row) throw new ConflictException('Không thể hủy yêu cầu đã bắt đầu hoặc đã xử lý.');
    return { data: this.publicReservation(row) };
  }

  async resolve(userId: string, venueSlug: string, id: string, action: 'confirm' | 'decline' | 'complete') {
    await this.business.requireOwner(userId, venueSlug);
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('Không tìm thấy yêu cầu giữ xe.');
    if (action !== 'confirm') return this.changeStatus(venueSlug, id, action);
    return this.withConfirmationLock(venueSlug, async () => {
      const row = await this.reservations.findOne({
        _id: new Types.ObjectId(id),
        venueSlug,
        status: 'PENDING',
      });
      if (!row) throw new ConflictException('Yêu cầu này không còn chờ xác nhận.');
      if (row.startsAt <= new Date()) throw new ConflictException('Giờ bắt đầu đã qua.');
      const facility = await this.facilities
        .findOne({ slug: row.facilitySlug, status: 'ACTIVE', kind: 'VENUE', venueSlugs: venueSlug })
        .lean();
      const now = new Date();
      if (
        !facility ||
        !facility.availabilityExpiresAt ||
        facility.availabilityExpiresAt <= now ||
        !facility.availableSpaces ||
        facility.availableSpaces <= 0
      )
        throw new ConflictException('Bãi không còn dữ liệu chỗ trống mới.');
      const overlapping = await this.reservations.countDocuments({
        facilitySlug: row.facilitySlug,
        status: 'CONFIRMED',
        startsAt: { $lt: row.endsAt },
        endsAt: { $gt: row.startsAt },
      });
      if (overlapping >= facility.availableSpaces)
        throw new ConflictException('Không đủ chỗ cho khung giờ này.');
      return this.changeStatus(venueSlug, id, action);
    });
  }

  private async changeStatus(venueSlug: string, id: string, action: 'confirm' | 'decline' | 'complete') {
    const status = action === 'confirm' ? 'CONFIRMED' : action === 'decline' ? 'DECLINED' : 'COMPLETED';
    const row = await this.reservations.findOneAndUpdate(
      { _id: new Types.ObjectId(id), venueSlug, status: action === 'complete' ? 'CONFIRMED' : 'PENDING' },
      { $set: { status, resolvedAt: new Date() } },
      { new: true },
    );
    if (!row) throw new ConflictException('Yêu cầu không thể chuyển sang trạng thái này.');
    return { data: this.publicReservation(row) };
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

  private publicReservation(row: ParkingReservation & { _id: Types.ObjectId }) {
    return {
      id: row._id.toString(),
      venueSlug: row.venueSlug,
      facilitySlug: row.facilitySlug,
      vehicleType: row.vehicleType,
      startsAt: row.startsAt,
      endsAt: row.endsAt,
      status: row.status,
      resolvedAt: row.resolvedAt,
      createdAt: row.createdAt,
    };
  }
}
