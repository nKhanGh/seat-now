import { ConflictException } from '@nestjs/common';
import { VoucherService } from '../services/voucher.service';

describe('Premium voucher claims', () => {
  const offers = { findOneAndUpdate: jest.fn(), updateOne: jest.fn() };
  const claims = { exists: jest.fn(), create: jest.fn() };
  const service = new VoucherService(offers as never, claims as never, {} as never, {} as never);
  const userId = '507f1f77bcf86cd799439011';
  const offerId = '507f191e810c19729de860ea';
  const offer = {
    _id: { toString: () => offerId },
    venueSlug: 'demo-cafe',
    venueName: 'Demo cafe',
    title: 'Giảm giá demo',
    discountText: 'Giảm 10%',
    startsAt: new Date(),
    expiresAt: new Date(Date.now() + 60_000),
    remaining: 1,
    status: 'ACTIVE',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    claims.exists.mockResolvedValue(null);
    offers.findOneAndUpdate.mockResolvedValue(offer);
    offers.updateOne.mockResolvedValue({ matchedCount: 1 });
    claims.create.mockResolvedValue({ code: 'SN-ABCDEF123456' });
  });

  it('returns one unique claim code after reserving stock', async () => {
    const result = await service.claim(userId, offerId);
    expect(result.data.code).toBe('SN-ABCDEF123456');
    expect(offers.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ remaining: { $gt: 0 } }),
      { $inc: { remaining: -1 } },
      { new: true },
    );
  });

  it('restores stock when a duplicate claim loses a race', async () => {
    claims.create.mockRejectedValueOnce({ code: 11000 });
    await expect(service.claim(userId, offerId)).rejects.toBeInstanceOf(ConflictException);
    expect(offers.updateOne).toHaveBeenCalledWith({ _id: expect.anything() }, { $inc: { remaining: 1 } });
  });
});
