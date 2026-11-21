import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../services/subscription.service';

export const subscriptionQueryKeys = {
  current: ['subscription', 'current'] as const,
  entitlements: ['subscription', 'entitlements'] as const,
};

export function useSubscription(enabled: boolean) {
  return useQuery({
    queryKey: subscriptionQueryKeys.current,
    queryFn: ({ signal }) => subscriptionService.current(signal),
    enabled,
  });
}

export function useEntitlements(enabled: boolean) {
  return useQuery({
    queryKey: subscriptionQueryKeys.entitlements,
    queryFn: ({ signal }) => subscriptionService.entitlements(signal),
    enabled,
    refetchInterval: 60_000,
  });
}
