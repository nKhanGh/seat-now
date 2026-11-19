import { useQuery } from '@tanstack/react-query';
import { getParkingForVenue, ParkingFilters } from '../services/parking.service';

export function useParkingForVenue(slug: string | null, filters: ParkingFilters) {
  return useQuery({
    queryKey: ['parking', 'venue', slug, filters],
    queryFn: ({ signal }) => getParkingForVenue(slug!, filters, signal),
    enabled: Boolean(slug), staleTime: 15_000, refetchInterval: 30_000, refetchOnWindowFocus: true,
  });
}
