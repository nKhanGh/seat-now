import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelBooking,
  createBooking,
  getBookingStatus,
  getMyBookings,
  getVenueBookings,
  resolveBooking,
  setBookingEnabled,
} from '../services/booking.service';

const myKey = (userId: string | null) => ['bookings', 'mine', userId] as const;
const venueKey = (slug: string, userId: string | null) => ['bookings', 'venue', slug, userId] as const;
const statusKey = (slug: string) => ['bookings', 'status', slug] as const;

export function useBookingStatus(slug: string) {
  return useQuery({ queryKey: statusKey(slug), queryFn: ({ signal }) => getBookingStatus(slug, signal) });
}
export function useMyBookings(userId: string | null) {
  return useQuery({
    queryKey: myKey(userId),
    queryFn: ({ signal }) => getMyBookings(signal),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  });
}
export function useVenueBookings(slug: string, userId: string | null) {
  return useQuery({
    queryKey: venueKey(slug, userId),
    queryFn: ({ signal }) => getVenueBookings(slug, signal),
    enabled: Boolean(userId),
    refetchInterval: 15_000,
  });
}
export function useCreateBooking(slug: string, userId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { requestedAt: string; guestCount: number; note: string }) =>
      createBooking(slug, input),
    onSuccess: () => client.invalidateQueries({ queryKey: myKey(userId) }),
  });
}
export function useCancelBooking(userId: string | null) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => client.invalidateQueries({ queryKey: myKey(userId) }),
  });
}
export function useBookingManagement(slug: string, userId: string | null) {
  const client = useQueryClient();
  const refresh = () =>
    Promise.all([
      client.invalidateQueries({ queryKey: venueKey(slug, userId) }),
      client.invalidateQueries({ queryKey: ['business', 'venues', userId] }),
      client.invalidateQueries({ queryKey: statusKey(slug) }),
    ]);
  const settings = useMutation({
    mutationFn: (enabled: boolean) => setBookingEnabled(slug, enabled),
    onSuccess: refresh,
  });
  const decision = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'CONFIRMED' | 'DECLINED' }) =>
      resolveBooking(slug, id, status),
    onSuccess: refresh,
  });
  return { settings, decision };
}
