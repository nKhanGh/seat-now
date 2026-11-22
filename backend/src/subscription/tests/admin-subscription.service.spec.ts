import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminSubscriptionService } from '../services/admin-subscription.service';

describe('Admin Premium demo grants', () => {
  const user = { _id: 'user-id', emailNormalized: 'demo@example.com', role: 'USER' };
  const users = { findOne: jest.fn(), find: jest.fn(), countDocuments: jest.fn() };
  const subscriptions = { updateOne: jest.fn(), find: jest.fn() };
  const service = new AdminSubscriptionService(users as never, subscriptions as never);

  beforeEach(() => {
    jest.clearAllMocks();
    users.findOne.mockResolvedValue(user);
    subscriptions.updateOne.mockResolvedValue({ matchedCount: 1 });
    users.find.mockReturnValue({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            lean: async () => [
              {
                _id: { toString: () => 'user-id' },
                emailNormalized: 'demo@example.com',
                displayName: 'Demo',
              },
            ],
          }),
        }),
      }),
    });
    users.countDocuments.mockResolvedValue(1);
    subscriptions.find.mockReturnValue({
      lean: async () => [
        {
          userId: { toString: () => 'user-id' },
          plan: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date(Date.now() - 60_000),
          currentPeriodEnd: new Date(Date.now() + 60_000),
        },
      ],
    });
  });

  it('lists only active users with effective Premium state and no password fields', async () => {
    const result = await service.listUsers({ q: 'demo@example.com', page: 1 });
    expect(users.find).toHaveBeenCalledWith(
      expect.objectContaining({ role: { $in: ['USER', null] }, status: 'ACTIVE' }),
      {
        emailNormalized: 1,
        displayName: 1,
      },
    );
    expect(result.data[0]).toEqual(expect.objectContaining({ email: 'demo@example.com', plan: 'PREMIUM' }));
    expect(result.data[0]).not.toHaveProperty('passwordHash');
    expect(result.meta).toEqual({ page: 1, total: 1, hasNext: false });
  });

  it('normalizes the email and grants a bounded demo period', async () => {
    const result = await service.grant(' Demo@Example.com ', 7);
    expect(users.findOne).toHaveBeenCalledWith({ emailNormalized: 'demo@example.com', status: 'ACTIVE' });
    expect(subscriptions.updateOne).toHaveBeenCalledWith(
      { userId: user._id },
      { $set: expect.objectContaining({ plan: 'PREMIUM', status: 'ACTIVE' }) },
      { upsert: true },
    );
    expect(result.data.plan).toBe('PREMIUM');
  });

  it('allows legacy user records without a role while rejecting admins', async () => {
    users.findOne.mockResolvedValueOnce({ ...user, role: undefined });
    await expect(service.grant('demo@example.com', 7)).resolves.toEqual({
      data: expect.objectContaining({ plan: 'PREMIUM' }),
    });
    users.findOne.mockResolvedValueOnce({ ...user, role: 'ADMIN' });
    await expect(service.grant('admin@example.com', 7)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects admin accounts and missing users', async () => {
    users.findOne.mockResolvedValueOnce({ ...user, role: 'ADMIN' }).mockResolvedValueOnce(null);
    await expect(service.grant('admin@example.com', 7)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.grant('missing@example.com', 7)).rejects.toBeInstanceOf(NotFoundException);
    expect(subscriptions.updateOne).not.toHaveBeenCalled();
  });
});
