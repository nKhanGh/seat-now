import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decideClaim, getPendingClaims } from '../services/admin.service';

const pendingClaimsKey = ['admin', 'business-claims'] as const;

export function usePendingBusinessClaims(enabled: boolean) {
  return useQuery({
    queryKey: pendingClaimsKey,
    queryFn: ({ signal }) => getPendingClaims(signal),
    enabled,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useDecideBusinessClaim() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => decideClaim(id, action),
    onSuccess: () => client.invalidateQueries({ queryKey: pendingClaimsKey }),
  });
}
