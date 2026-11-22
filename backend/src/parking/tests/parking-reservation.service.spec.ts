import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ParkingReservationService } from '../services/parking-reservation.service';

describe('Premium parking reservation requests', () => {
  const reservations = { exists: jest.fn(), create: jest.fn() };
  const facilities = { findOne: jest.fn() };
  const business = { requireOwner: jest.fn() };
  const parking = { ingest: jest.fn() };
  const service = new ParkingReservationService(
    reservations as never,
    facilities as never,
    business as never,
    parking as never,
  );
  const userId = '507f1f77bcf86cd799439011';

  beforeEach(() => {
    jest.clearAllMocks();
    reservations.exists.mockResolvedValue(false);
    parking.ingest.mockResolvedValue({ latestUpdated: true });
    reservations.create.mockImplementation(async (input) => ({
      _id: { toString: () => 'reservation-id' },
      ...input,
    }));
    facilities.findOne.mockReturnValue({
      lean: async () => ({
        vehicleTypes: ['MOTORBIKE'],
        availableSpaces: 2,
        availabilityExpiresAt: new Date(Date.now() + 60_000),
      }),
    });
  });

  it('lets an approved owner refresh linked parking capacity', async () => {
    facilities.findOne.mockReturnValueOnce({
      lean: async () => ({ availabilityVersion: 5 }),
    });
    const result = await service.updateAvailability(userId, 'demo-cafe', 'demo-parking', {
      totalSpaces: 20,
      availableSpaces: 4,
    });
    expect(business.requireOwner).toHaveBeenCalledWith(userId, 'demo-cafe');
    expect(facilities.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'demo-parking', venueSlugs: 'demo-cafe', kind: 'VENUE' }),
    );
    expect(parking.ingest).toHaveBeenCalledWith(
      'demo-parking',
      expect.objectContaining({ source: 'OPERATOR', totalSpaces: 20, availableSpaces: 4 }),
    );
    expect(result.data.availableSpaces).toBe(4);
  });

  function request(startOffsetMinutes = 45) {
    return {
      vehicleType: 'MOTORBIKE' as const,
      startsAt: new Date(Date.now() + startOffsetMinutes * 60_000).toISOString(),
      endsAt: new Date(Date.now() + (startOffsetMinutes + 60) * 60_000).toISOString(),
    };
  }

  it('keeps a valid request pending until a venue owner confirms it', async () => {
    const result = await service.create(userId, 'demo-cafe', 'demo-parking', request());
    expect(result.data.status).toBe('PENDING');
    expect(reservations.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'PENDING' }));
  });

  it('rejects past slots and facilities without fresh free spaces', async () => {
    await expect(service.create(userId, 'demo-cafe', 'demo-parking', request(-1))).rejects.toBeInstanceOf(
      BadRequestException,
    );
    facilities.findOne.mockReturnValueOnce({ lean: async () => null });
    await expect(service.create(userId, 'demo-cafe', 'public-parking', request())).rejects.toBeInstanceOf(
      NotFoundException,
    );
    facilities.findOne.mockReturnValueOnce({
      lean: async () => ({
        vehicleTypes: ['MOTORBIKE'],
        availableSpaces: 0,
        availabilityExpiresAt: new Date(Date.now() + 60_000),
      }),
    });
    await expect(service.create(userId, 'demo-cafe', 'demo-parking', request())).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
