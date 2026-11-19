export type SubscriptionState = {
  plan: 'FREE' | 'PREMIUM';
  status: 'FREE' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  evaluatedAt: string;
};

export type Entitlements = {
  plan: 'FREE' | 'PREMIUM';
  entitlements: Record<
    | 'map.basic'
    | 'availability.read'
    | 'parking.read'
    | 'ads.hidden'
    | 'booking.priority'
    | 'parking.reserve'
    | 'voucher.exclusive'
    | 'recommendation.advanced',
    boolean
  >;
  evaluatedAt: string;
};

async function getData<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', signal });
  if (!response.ok) throw new Error(`Không tải được thông tin gói (${response.status}).`);
  const body = (await response.json()) as { data: T };
  return body.data;
}

export const subscriptionService = {
  current: (signal?: AbortSignal) => getData<SubscriptionState>('/api/v1/me/subscription', signal),
  entitlements: (signal?: AbortSignal) => getData<Entitlements>('/api/v1/me/entitlements', signal),
};
