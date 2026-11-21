import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { BusinessAccessService } from '../../business/services/business-access.service';
import { AuthService } from '../../auth/services/auth.service';
import { EntitlementService } from '../../subscription/services/entitlement.service';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { Venue, VenueSchema } from '../../map/schemas/venue.schema';
import { BookingService } from '../services/booking.service';
import {
  AvailabilityLatest,
  AvailabilityLatestSchema,
} from '../../availability/schemas/availability-snapshot.schema';

const testUri = process.env.MONGODB_TEST_URI;
const describeWithMongo = testUri ? describe : describe.skip;

describeWithMongo('booking requests with MongoDB', () => {
  const dbName = `seatnow_test_${randomUUID().replaceAll('-', '')}`;
  let service: BookingService;
  const business = {
    requireBookingEnabled: jest.fn().mockResolvedValue(undefined),
    requireOwner: jest.fn().mockResolvedValue(undefined),
    setBookingEnabled: jest.fn(),
    bookingStatus: jest.fn(),
  };
  const entitlements = { can: jest.fn().mockResolvedValue(false) };
  const auth = {
    publicUsersByIds: jest
      .fn()
      .mockImplementation(async (ids: mongoose.Types.ObjectId[]) =>
        ids.map((id) => ({ id: id.toString(), displayName: 'Khách thử nghiệm' })),
      ),
  };
  const guest = new mongoose.Types.ObjectId().toString();
  const owner = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    await mongoose.connect(testUri!, { dbName });
    const model = mongoose.model(Booking.name, BookingSchema);
    const venues = mongoose.model(Venue.name, VenueSchema);
    const availability = mongoose.model(AvailabilityLatest.name, AvailabilityLatestSchema);
    await model.createIndexes();
    await venues.create({
      slug: 'cafe-a',
      name: 'Café A',
      category: 'CAFE',
      location: { type: 'Point', coordinates: [106.7, 10.77] },
      address: 'Quận 1, TP.HCM',
      priceTier: 2,
      rating: 4.5,
    });
    service = new BookingService(
      model,
      venues,
      availability,
      business as unknown as BusinessAccessService,
      entitlements as unknown as EntitlementService,
      auth as unknown as AuthService,
    );
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it('requires a participating venue and gives Premium requests priority without auto-confirming', async () => {
    const firstAt = new Date(Date.now() + 3 * 60 * 60_000).toISOString();
    const firstEnd = new Date(new Date(firstAt).getTime() + 2 * 60 * 60_000).toISOString();
    business.requireBookingEnabled.mockRejectedValueOnce(new ConflictException('Disabled'));
    await expect(
      service.create(guest, 'cafe-a', { requestedAt: firstAt, endsAt: firstEnd, guestCount: 2 }),
    ).rejects.toThrow(ConflictException);
    expect(await service.mine(guest)).toEqual({ data: [] });

    const ordinary = (
      await service.create(guest, 'cafe-a', { requestedAt: firstAt, endsAt: firstEnd, guestCount: 2 })
    ).data;
    expect(ordinary).toMatchObject({
      status: 'PENDING',
      priority: false,
      guestCount: 2,
      endsAt: new Date(firstEnd),
    });
    expect((await service.mine(guest)).data[0]).toMatchObject({
      venueName: 'Café A',
      venueLocation: { coordinates: [106.7, 10.77] },
    });
    await expect(
      service.create(guest, 'cafe-a', { requestedAt: firstAt, endsAt: firstEnd, guestCount: 2 }),
    ).rejects.toThrow(ConflictException);

    entitlements.can.mockResolvedValueOnce(true);
    const secondAt = new Date(Date.now() + 4 * 60 * 60_000).toISOString();
    const premium = (
      await service.create(guest, 'cafe-a', {
        requestedAt: secondAt,
        endsAt: new Date(new Date(secondAt).getTime() + 2 * 60 * 60_000).toISOString(),
        guestCount: 3,
      })
    ).data;
    const queue = (await service.forVenue(owner, 'cafe-a')).data;
    expect(queue.map((row) => row.id)).toEqual([premium.id, ordinary.id]);
    expect(queue[0].guestDisplayName).toBe('Khách thử nghiệm');
    expect(premium).toMatchObject({ status: 'PENDING', priority: true });
    expect(business.requireOwner).toHaveBeenCalledWith(owner, 'cafe-a');

    business.requireOwner.mockRejectedValueOnce(new ForbiddenException());
    await expect(service.forVenue(guest, 'cafe-a')).rejects.toThrow(ForbiddenException);
    expect((await service.resolve(owner, 'cafe-a', ordinary.id, 'CONFIRMED')).data.status).toBe('CONFIRMED');
    expect((await service.forVenue(owner, 'cafe-a')).data.map((row) => row.status)).toEqual([
      'PENDING',
      'CONFIRMED',
    ]);
    await expect(service.resolve(owner, 'cafe-a', ordinary.id, 'DECLINED')).rejects.toThrow(
      ConflictException,
    );
    expect((await service.cancel(guest, ordinary.id)).data.status).toBe('CANCELED');
    expect((await service.forVenue(owner, 'cafe-a')).data.map((row) => row.id)).toEqual([premium.id]);
    await expect(service.cancel(guest, ordinary.id)).rejects.toThrow(ConflictException);
    expect((await service.resolve(owner, 'cafe-a', premium.id, 'DECLINED')).data.status).toBe('DECLINED');
    const thirdAt = new Date(Date.now() + 5 * 60 * 60_000).toISOString();
    const arriving = (
      await service.create(guest, 'cafe-a', {
        requestedAt: thirdAt,
        endsAt: new Date(new Date(thirdAt).getTime() + 2 * 60 * 60_000).toISOString(),
        guestCount: 4,
      })
    ).data;
    await expect(service.resolve(owner, 'cafe-a', arriving.id, 'COMPLETED')).rejects.toThrow(
      ConflictException,
    );
    const confirmed = (await service.resolve(owner, 'cafe-a', arriving.id, 'CONFIRMED')).data;
    business.requireOwner.mockRejectedValueOnce(new ForbiddenException());
    await expect(service.resolve(guest, 'cafe-a', arriving.id, 'COMPLETED')).rejects.toThrow(
      ForbiddenException,
    );
    const completed = (await service.resolve(owner, 'cafe-a', arriving.id, 'COMPLETED')).data;
    expect(completed).toMatchObject({ status: 'COMPLETED', resolvedAt: confirmed.resolvedAt });
    expect(completed.completedAt).toBeTruthy();
    expect((await service.forVenue(owner, 'cafe-a')).data).toEqual([]);
    expect((await service.mine(guest)).data[0].status).toBe('COMPLETED');
    await expect(service.cancel(guest, arriving.id)).rejects.toThrow(ConflictException);
    await expect(service.resolve(owner, 'cafe-a', arriving.id, 'DECLINED')).rejects.toThrow(
      ConflictException,
    );
  });

  it('rejects invalid intervals and prevents confirming overlapping requests after all tables are assigned', async () => {
    const start = Date.now() + 8 * 60 * 60_000;
    const at = (offsetMinutes: number) => new Date(start + offsetMinutes * 60_000).toISOString();
    const otherGuest = new mongoose.Types.ObjectId().toString();
    await expect(
      service.create(guest, 'cafe-a', { requestedAt: at(0), endsAt: at(0), guestCount: 2 }),
    ).rejects.toThrow('Booking duration');
    await expect(
      service.create(guest, 'cafe-a', { requestedAt: at(0), endsAt: at(300), guestCount: 2 }),
    ).rejects.toThrow('Booking duration');
    await mongoose.model(AvailabilityLatest.name).create({
      slug: 'cafe-a',
      version: 1,
      tables: { total: 1, available: 1 },
      seats: { total: 4, available: 4 },
      crowdLevel: 'QUIET',
      acceptingGuests: true,
      source: 'OPERATOR',
      confidence: 1,
      capturedAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    });
    const first = (
      await service.create(guest, 'cafe-a', { requestedAt: at(0), endsAt: at(120), guestCount: 2 })
    ).data;
    const overlap = (
      await service.create(otherGuest, 'cafe-a', { requestedAt: at(60), endsAt: at(120), guestCount: 2 })
    ).data;
    const adjacent = (
      await service.create(otherGuest, 'cafe-a', { requestedAt: at(120), endsAt: at(180), guestCount: 2 })
    ).data;
    await service.resolve(owner, 'cafe-a', first.id, 'CONFIRMED');
    await expect(service.resolve(owner, 'cafe-a', overlap.id, 'CONFIRMED')).rejects.toThrow('Không còn bàn');
    expect((await service.resolve(owner, 'cafe-a', adjacent.id, 'CONFIRMED')).data.status).toBe('CONFIRMED');
    await service.cancel(guest, first.id);
    expect((await service.resolve(owner, 'cafe-a', overlap.id, 'CONFIRMED')).data.status).toBe('CONFIRMED');
    const simultaneousA = (
      await service.create(guest, 'cafe-a', { requestedAt: at(240), endsAt: at(300), guestCount: 2 })
    ).data;
    const simultaneousB = (
      await service.create(otherGuest, 'cafe-a', { requestedAt: at(240), endsAt: at(300), guestCount: 2 })
    ).data;
    const outcomes = await Promise.allSettled([
      service.resolve(owner, 'cafe-a', simultaneousA.id, 'CONFIRMED'),
      service.resolve(owner, 'cafe-a', simultaneousB.id, 'CONFIRMED'),
    ]);
    expect(outcomes.map((outcome) => outcome.status).sort()).toEqual(['fulfilled', 'rejected']);
    await mongoose.connection.collection('venues').deleteOne({ slug: 'cafe-a' });
    expect((await service.mine(guest)).data[0]).toMatchObject({ venueName: 'cafe-a', venueLocation: null });
  });
});
