import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { UserSubscription } from '../schemas/user-subscription.schema';
import { AdminUsersQueryDto } from '../dto/admin-users-query.dto';
import { effectivePlan } from './entitlement.service';

@Injectable()
export class AdminSubscriptionService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(UserSubscription.name) private readonly subscriptions: Model<UserSubscription>,
  ) {}

  async listUsers({ q, page }: AdminUsersQueryDto) {
    const search = q?.trim();
    const escaped = search?.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = {
      role: 'USER',
      status: 'ACTIVE',
      ...(escaped
        ? {
            $or: [
              { emailNormalized: { $regex: escaped, $options: 'i' } },
              { displayName: { $regex: escaped, $options: 'i' } },
            ],
          }
        : {}),
    };
    const limit = 20;
    const [users, total] = await Promise.all([
      this.users
        .find(filter, { emailNormalized: 1, displayName: 1 })
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.users.countDocuments(filter),
    ]);
    const subscriptions = await this.subscriptions
      .find({ userId: { $in: users.map((user) => user._id) } })
      .lean();
    const byUserId = new Map(
      subscriptions.map((subscription) => [subscription.userId.toString(), subscription]),
    );
    const now = new Date();
    return {
      data: users.map((user) => {
        const subscription = byUserId.get(user._id.toString());
        const premium = effectivePlan(subscription ?? null, now) === 'PREMIUM';
        return {
          id: user._id.toString(),
          email: user.emailNormalized,
          displayName: user.displayName,
          plan: premium ? 'PREMIUM' : 'FREE',
          currentPeriodEnd: premium ? (subscription?.currentPeriodEnd ?? null) : null,
        };
      }),
      meta: { page, total, hasNext: page * limit < total },
    };
  }

  private async target(email: string) {
    const user = await this.users.findOne({ emailNormalized: email.trim().toLowerCase(), status: 'ACTIVE' });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản đang hoạt động.');
    if (user.role !== 'USER') throw new BadRequestException('Chỉ cấp Premium demo cho tài khoản người dùng.');
    return user;
  }

  async grant(email: string, days: number) {
    const user = await this.target(email);
    const now = new Date();
    const currentPeriodEnd = new Date(now.getTime() + days * 24 * 60 * 60_000);
    await this.subscriptions.updateOne(
      { userId: user._id },
      {
        $set: {
          plan: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      },
      { upsert: true },
    );
    return { data: { email: user.emailNormalized, plan: 'PREMIUM', currentPeriodEnd } };
  }

  async revoke(email: string) {
    const user = await this.target(email);
    const result = await this.subscriptions.updateOne(
      { userId: user._id, status: { $in: ['ACTIVE', 'CANCELED'] } },
      { $set: { status: 'EXPIRED', currentPeriodEnd: new Date() } },
    );
    if (!result.matchedCount)
      throw new NotFoundException('Tài khoản này chưa có Premium demo đang hoạt động.');
    return { data: { email: user.emailNormalized, plan: 'FREE' } };
  }
}
