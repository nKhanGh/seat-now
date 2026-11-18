import { useQuery } from '@tanstack/react-query';
import { getNearbyVenues, MapFilters } from '../services/map.service';

export const mapQueryKeys = { nearby: (filters: MapFilters) => ['map', 'nearby', filters] as const };

export function useNearbyVenues(filters: MapFilters) {
  return useQuery({ queryKey: mapQueryKeys.nearby(filters), queryFn: ({ signal }) => getNearbyVenues(filters, signal), staleTime: 30_000 });
}
