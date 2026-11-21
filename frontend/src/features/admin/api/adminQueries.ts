import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { decideClaim, decideProposal, getPendingClaims, getReadyProposals } from '../services/admin.service';

const pendingClaimsKey = ['admin', 'business-claims'] as const;
const readyProposalsKey = ['admin', 'proposals'] as const;

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

export function useReadyProposals(enabled: boolean) {
  return useQuery({
    queryKey: readyProposalsKey,
    queryFn: ({ signal }) => getReadyProposals(signal),
    enabled,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
  });
}

export function useDecideProposal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) => decideProposal(id, action),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: readyProposalsKey }),
        client.invalidateQueries({ queryKey: ['community', 'proposals'] }),
        client.invalidateQueries({ queryKey: ['map'] }),
      ]),
  });
}
