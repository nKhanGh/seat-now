import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { parkingReservationService } from '../services/parkingReservation.service';

const mineKey = ['parking', 'reservations', 'mine'] as const;
const venueKey = (slug: string) => ['parking', 'reservations', 'venue', slug] as const;

export function useMyParkingReservations(enabled: boolean) {
  return useQuery({
    queryKey: mineKey,
    queryFn: ({ signal }) => parkingReservationService.mine(signal),
    enabled,
    staleTime: 10_000,
  });
}

export function useCreateParkingReservation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      slug,
      facilitySlug,
      input,
    }: {
      slug: string;
      facilitySlug: string;
      input: Parameters<typeof parkingReservationService.create>[2];
    }) => parkingReservationService.create(slug, facilitySlug, input),
    onSuccess: () => client.invalidateQueries({ queryKey: mineKey }),
  });
}

export function useCancelParkingReservation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: parkingReservationService.cancel,
    onSuccess: () => client.invalidateQueries({ queryKey: mineKey }),
  });
}

export function useVenueParkingReservations(slug: string) {
  return useQuery({
    queryKey: venueKey(slug),
    queryFn: ({ signal }) => parkingReservationService.forVenue(slug, signal),
    staleTime: 10_000,
  });
}

export function useOwnedParkingFacilities(slug: string) {
  return useQuery({
    queryKey: ['parking', 'owned-facilities', slug],
    queryFn: ({ signal }) => parkingReservationService.ownedFacilities(slug, signal),
    staleTime: 10_000,
  });
}

export function useUpdateParkingAvailability(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      facilitySlug,
      totalSpaces,
      availableSpaces,
    }: {
      facilitySlug: string;
      totalSpaces: number;
      availableSpaces: number;
    }) => parkingReservationService.updateAvailability(slug, facilitySlug, { totalSpaces, availableSpaces }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['parking', 'owned-facilities', slug] });
      void client.invalidateQueries({ queryKey: ['parking', 'venue', slug] });
    },
  });
}

export function useResolveParkingReservation(slug: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'confirm' | 'decline' | 'complete' }) =>
      parkingReservationService.resolve(slug, id, action),
    onSuccess: () => client.invalidateQueries({ queryKey: venueKey(slug) }),
  });
}
