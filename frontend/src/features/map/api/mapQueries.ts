import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getNearbyVenues, getVenueDetail, MapFilters } from '../services/map.service';

export const mapQueryKeys = { nearby: (filters: MapFilters) => ['map', 'nearby', filters] as const };

export function useNearbyVenues(filters: MapFilters) {
  return useInfiniteQuery({
    queryKey: mapQueryKeys.nearby(filters),
    queryFn: ({ signal, pageParam }) => getNearbyVenues(filters, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    staleTime: 15_000, refetchInterval: 30_000, refetchOnWindowFocus: true,
  });
}

export function useVenueDetail(slug: string | null) {
  return useQuery({ queryKey: ['venues', 'detail', slug], queryFn: ({ signal }) => getVenueDetail(slug!, signal), enabled: Boolean(slug), staleTime: 30_000 });
}
