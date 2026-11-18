export type VenueMapItem = {
  id: string;
  name: string;
  slug: string;
  address: string;
  category: 'RESTAURANT' | 'CAFE' | 'CINEMA';
  location: { type: 'Point'; coordinates: [number, number] };
  distanceM: number;
  priceTier: number;
  rating: number;
  availability: {
    crowdLevel: 'QUIET' | 'MODERATE' | 'BUSY' | 'FULL' | 'UNKNOWN';
    tablesAvailable: number | null; tablesTotal: number | null;
    seatsAvailable: number | null; seatsTotal: number | null;
    estimatedWaitMinutes: number | null; acceptingGuests: boolean | null;
    source: 'DEMO' | 'OPERATOR' | 'POS' | null;
    confidence: number | null; version: number | null;
    capturedAt: string | null; expiresAt: string | null;
    freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  };
};

export type MapFilters = {
  lat: number;
  lng: number;
  radiusM: number;
  category?: string;
  priceTier?: number;
  ratingGte?: number;
  crowdLevel?: string;
  hasAvailability?: boolean;
};

export type MapResponse = { data: VenueMapItem[]; meta: { truncated: boolean; queryCenter: { lat: number; lng: number } } };

export async function getNearbyVenues(filters: MapFilters, signal?: AbortSignal): Promise<MapResponse> {
  const params = new URLSearchParams({ lat: String(filters.lat), lng: String(filters.lng), radiusM: String(filters.radiusM) });
  if (filters.category) params.set('category', filters.category);
  if (filters.priceTier) params.set('priceTier', String(filters.priceTier));
  if (filters.ratingGte) params.set('ratingGte', String(filters.ratingGte));
  if (filters.crowdLevel) params.set('crowdLevel', filters.crowdLevel);
  if (filters.hasAvailability) params.set('hasAvailability', 'true');
  const response = await fetch(`/api/v1/map/venues?${params}`, { signal });
  if (!response.ok) throw new Error(`Không tải được địa điểm (${response.status}).`);
  return response.json() as Promise<MapResponse>;
}
