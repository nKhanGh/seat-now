import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { confirmProposal, createProposal, getProposals, ProposalInput } from '../services/proposals.service';

const proposalsKey = ['community', 'proposals'] as const;

export function useProposals() {
  return useQuery({ queryKey: proposalsKey, queryFn: ({ signal }) => getProposals(signal), staleTime: 15_000 });
}

export function useCreateProposal() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (input: ProposalInput) => createProposal(input), onSuccess: () => client.invalidateQueries({ queryKey: proposalsKey }) });
}

export function useConfirmProposal() {
  const client = useQueryClient();
  return useMutation({ mutationFn: (id: string) => confirmProposal(id), onSuccess: () => client.invalidateQueries({ queryKey: proposalsKey }) });
}
