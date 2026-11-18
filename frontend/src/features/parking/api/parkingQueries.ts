import { useQuery } from '@tanstack/react-query';
import { getParkingForVenue } from '../services/parking.service';

export function useParkingForVenue(slug: string | null) {
  return useQuery({
    queryKey: ['parking', 'venue', slug],
    queryFn: ({ signal }) => getParkingForVenue(slug!, signal),
    enabled: Boolean(slug), staleTime: 15_000, refetchInterval: 30_000, refetchOnWindowFocus: true,
  });
}
