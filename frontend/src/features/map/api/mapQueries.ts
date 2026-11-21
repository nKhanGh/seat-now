import { useEffect, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getNearbyVenues,
  getPublishedVenues,
  getVenueDetail,
  MapFilters,
  VenueMapItem,
} from '../services/map.service';

export const mapQueryKeys = { nearby: (filters: MapFilters) => ['map', 'nearby', filters] as const };
const retryMapQuery = (failures: number, error: Error) => failures < 2 && !error.message.includes('(429)');

export function useNearbyVenues(filters: MapFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: mapQueryKeys.nearby(filters),
    queryFn: ({ signal, pageParam }) => getNearbyVenues(filters, pageParam, signal),
    initialPageParam: null as string | null,
    enabled,
    getNextPageParam: (lastPage) => lastPage.meta.nextCursor,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: retryMapQuery,
  });
}

export function usePublishedVenueSearch(query: string) {
  const [debounced, setDebounced] = useState(query.trim());
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  const result = useQuery({
    queryKey: ['map', 'search', debounced],
    queryFn: ({ signal }) => getPublishedVenues(debounced, signal),
    enabled: debounced.length >= 2,
    staleTime: 60_000,
    retry: retryMapQuery,
  });
  return { query: result, activeQuery: debounced };
}

export function useVenueDetail(slug: string | null) {
  return useQuery({
    queryKey: ['venues', 'detail', slug],
    queryFn: ({ signal }) => getVenueDetail(slug!, signal),
    enabled: Boolean(slug),
    staleTime: 30_000,
  });
}

export function useHcmVenuePins(filters: MapFilters, enabled = true) {
  const catalogFilters = { ...filters, lat: 10.7769, lng: 106.7009, radiusM: 20_000 };
  return useQuery({
    queryKey: ['map', 'hcm-pins', catalogFilters],
    enabled,
    queryFn: async ({ signal }) => {
      const items: VenueMapItem[] = [];
      let cursor: string | null = null;
      do {
        const page = await getNearbyVenues(catalogFilters, cursor, signal, 50);
        items.push(...page.data);
        cursor = page.meta.nextCursor;
      } while (cursor && items.length < 200);
      return items;
    },
    staleTime: 300_000,
    refetchInterval: 300_000,
    refetchOnWindowFocus: false,
    retry: retryMapQuery,
  });
}
