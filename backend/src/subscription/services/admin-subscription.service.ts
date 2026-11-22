import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../auth/schemas/user.schema';
import { UserSubscription } from '../schemas/user-subscription.schema';

@Injectable()
export class AdminSubscriptionService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(UserSubscription.name) private readonly subscriptions: Model<UserSubscription>,
  ) {}

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
