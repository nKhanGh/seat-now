import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminSubscriptionService } from '../services/admin-subscription.service';

describe('Admin Premium demo grants', () => {
  const user = { _id: 'user-id', emailNormalized: 'demo@example.com', role: 'USER' };
  const users = { findOne: jest.fn() };
  const subscriptions = { updateOne: jest.fn() };
  const service = new AdminSubscriptionService(users as never, subscriptions as never);

  beforeEach(() => {
    jest.clearAllMocks();
    users.findOne.mockResolvedValue(user);
    subscriptions.updateOne.mockResolvedValue({ matchedCount: 1 });
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

  it('rejects admin accounts and missing users', async () => {
    users.findOne.mockResolvedValueOnce({ ...user, role: 'ADMIN' }).mockResolvedValueOnce(null);
    await expect(service.grant('admin@example.com', 7)).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.grant('missing@example.com', 7)).rejects.toBeInstanceOf(NotFoundException);
    expect(subscriptions.updateOne).not.toHaveBeenCalled();
  });
});
