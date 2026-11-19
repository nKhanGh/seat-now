import { useInfiniteQuery } from '@tanstack/react-query';
import { getParkingForVenue, ParkingFilters } from '../services/parking.service';

export function useParkingForVenue(slug: string | null, filters: ParkingFilters) {
  return useInfiniteQuery({
    queryKey: ['parking', 'venue', slug, filters],
    queryFn: ({ signal, pageParam }) => getParkingForVenue(slug!, filters, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    enabled: Boolean(slug),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}
