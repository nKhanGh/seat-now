import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserSubscription } from '../schemas/user-subscription.schema';

export const entitlementKeys = [
  'map.basic', 'availability.read', 'parking.read', 'ads.hidden',
  'booking.priority', 'parking.reserve', 'voucher.exclusive', 'recommendation.advanced',
] as const;
export type EntitlementKey = typeof entitlementKeys[number];
export type EffectivePlan = 'FREE' | 'PREMIUM';

const freeEntitlements: Record<EntitlementKey, boolean> = {
  'map.basic': true, 'availability.read': true, 'parking.read': true,
  'ads.hidden': false, 'booking.priority': false, 'parking.reserve': false,
  'voucher.exclusive': false, 'recommendation.advanced': false,
};

export function effectivePlan(subscription: Pick<UserSubscription, 'status' | 'currentPeriodStart' | 'currentPeriodEnd'> | null, now: Date): EffectivePlan {
  if (!subscription) return 'FREE';
  if (!['ACTIVE', 'CANCELED'].includes(subscription.status)) return 'FREE';
  return subscription.currentPeriodStart <= now && now < subscription.currentPeriodEnd ? 'PREMIUM' : 'FREE';
}

export function resolveEntitlements(plan: EffectivePlan): Record<EntitlementKey, boolean> {
  if (plan === 'FREE') return { ...freeEntitlements };
  return Object.fromEntries(entitlementKeys.map((key) => [key, true])) as Record<EntitlementKey, boolean>;
}

@Injectable()
export class EntitlementService {
  constructor(@InjectModel(UserSubscription.name) private readonly subscriptions: Model<UserSubscription>) {}

  async state(userId: string, now = new Date()) {
    const subscription = await this.subscriptions.findOne({ userId: new Types.ObjectId(userId) }).lean();
    const plan = effectivePlan(subscription, now);
    return {
      plan, status: subscription?.status ?? 'FREE',
      currentPeriodStart: subscription?.currentPeriodStart ?? null,
      currentPeriodEnd: subscription?.currentPeriodEnd ?? null,
      cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd ?? false,
      evaluatedAt: now,
    };
  }

  async entitlements(userId: string, now = new Date()) {
    const state = await this.state(userId, now);
    return { plan: state.plan, entitlements: resolveEntitlements(state.plan), evaluatedAt: now };
  }

  async can(userId: string, key: EntitlementKey, now = new Date()) {
    const result = await this.entitlements(userId, now);
    return result.entitlements[key];
  }
}
