import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  confirmProposal,
  createProposal,
  getMyProposals,
  getProposals,
  ProposalInput,
} from '../services/proposals.service';

const proposalsKey = ['community', 'proposals'] as const;

export function useProposals() {
  return useQuery({
    queryKey: proposalsKey,
    queryFn: ({ signal }) => getProposals(signal),
    staleTime: 15_000,
  });
}

export function useMyProposals(userId: string | null) {
  return useQuery({
    queryKey: ['community', 'proposals', 'mine', userId],
    queryFn: ({ signal }) => getMyProposals(signal),
    enabled: Boolean(userId),
  });
}

export function useCreateProposal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: ProposalInput) => createProposal(input),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: proposalsKey }),
        client.invalidateQueries({ queryKey: ['community', 'proposals', 'mine'] }),
      ]),
  });
}

export function useConfirmProposal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => confirmProposal(id),
    onSuccess: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: proposalsKey }),
        client.invalidateQueries({ queryKey: ['community', 'proposals', 'mine'] }),
      ]),
  });
}
