import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { ConflictException, ForbiddenException } from '@nestjs/common';
import { BusinessAccessService } from '../../business/services/business-access.service';
import { AuthService } from '../../auth/services/auth.service';
import { EntitlementService } from '../../subscription/services/entitlement.service';
import { Booking, BookingSchema } from '../schemas/booking.schema';
import { BookingService } from '../services/booking.service';

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
    await model.createIndexes();
    service = new BookingService(
      model,
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
    business.requireBookingEnabled.mockRejectedValueOnce(new ConflictException('Disabled'));
    await expect(service.create(guest, 'cafe-a', { requestedAt: firstAt, guestCount: 2 })).rejects.toThrow(
      ConflictException,
    );
    expect(await service.mine(guest)).toEqual({ data: [] });

    const ordinary = (await service.create(guest, 'cafe-a', { requestedAt: firstAt, guestCount: 2 })).data;
    expect(ordinary).toMatchObject({ status: 'PENDING', priority: false, guestCount: 2 });
    await expect(service.create(guest, 'cafe-a', { requestedAt: firstAt, guestCount: 2 })).rejects.toThrow(
      ConflictException,
    );

    entitlements.can.mockResolvedValueOnce(true);
    const secondAt = new Date(Date.now() + 4 * 60 * 60_000).toISOString();
    const premium = (await service.create(guest, 'cafe-a', { requestedAt: secondAt, guestCount: 3 })).data;
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
  });
});
