import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BusinessProfileInput,
  CampaignInput,
  ManualAvailabilityInput,
  clearCampaign,
  getBusinessDashboard,
  getMyBusinessVenues,
  getMyClaims,
  requestBusinessClaim,
  updateBusinessProfile,
  updateCampaign,
  updateManualAvailability,
  uploadBusinessLogo,
  uploadBusinessCover,
} from '../services/business.service';

const claimsKey = (userId: string | null) => ['business', 'claims', userId] as const;
const venuesKey = (userId: string | null) => ['business', 'venues', userId] as const;

export function useBusinessClaims(userId: string | null) {
  return useQuery({
    queryKey: claimsKey(userId),
    queryFn: ({ signal }) => getMyClaims(signal),
    enabled: Boolean(userId),
  });
}

export function useBusinessVenues(userId: string | null) {
  return useQuery({
    queryKey: venuesKey(userId),
    queryFn: ({ signal }) => getMyBusinessVenues(signal),
    enabled: Boolean(userId),
  });
}

export function useRequestBusinessClaim(userId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, evidence, document }: { slug: string; evidence: string; document: File | null }) =>
      requestBusinessClaim(slug, evidence, document),
    onSuccess: () => client.invalidateQueries({ queryKey: claimsKey(userId) }),
  });
}

export function useUpdateBusinessProfile(userId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: BusinessProfileInput }) =>
      updateBusinessProfile(slug, input),
    onSuccess: (_, { slug }) =>
      Promise.all([
        client.invalidateQueries({ queryKey: venuesKey(userId) }),
        client.invalidateQueries({ queryKey: ['venues', 'detail', slug] }),
        client.invalidateQueries({ queryKey: ['map', 'nearby'] }),
      ]),
  });
}

export function useManualAvailability() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: ManualAvailabilityInput }) =>
      updateManualAvailability(slug, input),
    onSuccess: (_, { slug }) =>
      Promise.all([
        client.invalidateQueries({ queryKey: ['venues', 'detail', slug] }),
        client.invalidateQueries({ queryKey: ['availability', slug] }),
        client.invalidateQueries({ queryKey: ['map', 'nearby'] }),
      ]),
  });
}

export function useUploadBusinessLogo(userId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, file }: { slug: string; file: File }) => uploadBusinessLogo(slug, file),
    onSuccess: (_, { slug }) =>
      Promise.all([
        client.invalidateQueries({ queryKey: venuesKey(userId) }),
        client.invalidateQueries({ queryKey: ['venues', 'detail', slug] }),
        client.invalidateQueries({ queryKey: ['map', 'nearby'] }),
      ]),
  });
}

export function useUploadBusinessCover(userId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, file }: { slug: string; file: File }) => uploadBusinessCover(slug, file),
    onSuccess: (_, { slug }) =>
      Promise.all([
        client.invalidateQueries({ queryKey: venuesKey(userId) }),
        client.invalidateQueries({ queryKey: ['venues', 'detail', slug] }),
      ]),
  });
}

export function useBusinessDashboard(slug: string | null, userId: string | null) {
  return useQuery({
    queryKey: ['business', 'dashboard', userId, slug],
    queryFn: ({ signal }) => getBusinessDashboard(slug!, signal),
    enabled: Boolean(userId && slug),
    staleTime: 60_000,
  });
}

export function useBusinessCampaign(userId: string | null) {
  const client = useQueryClient();
  const invalidate = (slug: string) =>
    Promise.all([
      client.invalidateQueries({ queryKey: venuesKey(userId) }),
      client.invalidateQueries({ queryKey: ['venues', 'detail', slug] }),
      client.invalidateQueries({ queryKey: ['map', 'nearby'] }),
    ]);
  const save = useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: CampaignInput }) => updateCampaign(slug, input),
    onSuccess: (_, { slug }) => invalidate(slug),
  });
  const remove = useMutation({
    mutationFn: (slug: string) => clearCampaign(slug),
    onSuccess: (_, slug) => invalidate(slug),
  });
  return { save, remove };
}
