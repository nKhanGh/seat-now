import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCheckIn, getCheckInSummary } from '../services/checkIn.service';

const summaryKey = (slug: string | null) => ['community', 'check-ins', slug] as const;

export function useCheckInSummary(slug: string | null) {
  return useQuery({
    queryKey: summaryKey(slug),
    queryFn: ({ signal }) => getCheckInSummary(slug!, signal),
    enabled: Boolean(slug),
    refetchInterval: 60_000,
  });
}

export function useCreateCheckIn() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      position,
    }: {
      slug: string;
      position: { lat: number; lng: number; accuracyM: number };
    }) => createCheckIn(slug, position),
    onSuccess: (_, { slug }) => client.invalidateQueries({ queryKey: summaryKey(slug) }),
  });
}
