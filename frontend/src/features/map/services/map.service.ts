export type VenueMapItem = {
  id: string;
  name: string;
  slug: string;
  address: string;
  category: 'RESTAURANT' | 'CAFE' | 'CINEMA';
  cuisineTypes: Array<'VIETNAMESE' | 'WESTERN' | 'COFFEE' | 'DESSERT'>;
  location: { type: 'Point'; coordinates: [number, number] };
  distanceM: number;
  priceTier: number;
  rating: number;
  verified: boolean;
  logoUrl: string | null;
  promotion: { text: string; startsAt: string; endsAt: string; sponsored: boolean } | null;
  availability: {
    crowdLevel: 'QUIET' | 'MODERATE' | 'BUSY' | 'FULL' | 'UNKNOWN';
    tablesAvailable: number | null;
    tablesTotal: number | null;
    seatsAvailable: number | null;
    seatsTotal: number | null;
    estimatedWaitMinutes: number | null;
    acceptingGuests: boolean | null;
    source: 'DEMO' | 'OPERATOR' | 'POS' | null;
    confidence: number | null;
    version: number | null;
    capturedAt: string | null;
    expiresAt: string | null;
    freshness: 'FRESH' | 'STALE' | 'UNKNOWN';
  };
};

export type MapFilters = {
  lat: number;
  lng: number;
  radiusM: number;
  category?: string;
  cuisine?: string;
  priceTier?: number;
  ratingGte?: number;
  crowdLevel?: string;
  hasAvailability?: boolean;
  adsHidden?: boolean;
};

export type MapResponse = {
  data: VenueMapItem[];
  meta: { nextCursor: string | null; truncated: boolean; queryCenter: { lat: number; lng: number } };
};

export type VenueSearchItem = Pick<
  VenueMapItem,
  'id' | 'slug' | 'name' | 'address' | 'category' | 'location' | 'rating' | 'priceTier'
>;

export type VenueSearchResponse = { data: VenueSearchItem[]; meta: { truncated: boolean } };

export async function getPublishedVenues(query: string, signal?: AbortSignal): Promise<VenueSearchResponse> {
  const params = new URLSearchParams({ q: query });
  const response = await fetch(`/api/v1/map/search?${params}`, { signal });
  if (!response.ok) throw new Error(`Không tìm được địa điểm toàn hệ thống (${response.status}).`);
  return response.json() as Promise<VenueSearchResponse>;
}

export type VenueDetail = {
  id: string;
  slug: string;
  name: string;
  category: VenueMapItem['category'];
  cuisineTypes: VenueMapItem['cuisineTypes'];
  description: string;
  openingHours: string;
  menuSummary: string;
  address: string;
  location: VenueMapItem['location'];
  priceTier: number;
  rating: number;
  verified: boolean;
  logoUrl: string | null;
  coverUrl: string | null;
  promotion: VenueMapItem['promotion'];
};

export type AvailabilityHistory = {
  data: Array<{
    version: number;
    tables: { total: number; available: number } | null;
    seats: { total: number; available: number } | null;
    crowdLevel: VenueMapItem['availability']['crowdLevel'];
    estimatedWaitMinutes: number | null;
    acceptingGuests: boolean;
    source: 'DEMO' | 'OPERATOR' | 'POS';
    capturedAt: string;
    freshness: 'FRESH' | 'STALE';
  }>;
  meta: { truncated: boolean; windowHours: number };
};

export async function getAvailabilityHistory(
  slug: string,
  signal?: AbortSignal,
): Promise<AvailabilityHistory> {
  const response = await fetch(`/api/v1/venues/${encodeURIComponent(slug)}/availability/history`, { signal });
  if (!response.ok) throw new Error(`Không tải được lịch sử chỗ ngồi (${response.status}).`);
  return response.json() as Promise<AvailabilityHistory>;
}

export async function getVenueDetail(slug: string, signal?: AbortSignal): Promise<VenueDetail> {
  const response = await fetch(`/api/v1/venues/${encodeURIComponent(slug)}`, { signal });
  if (!response.ok) throw new Error(`Không tải được chi tiết địa điểm (${response.status}).`);
  const body = (await response.json()) as { data: VenueDetail };
  return body.data;
}

export async function getNearbyVenues(
  filters: MapFilters,
  cursor: string | null,
  signal?: AbortSignal,
  limit = 20,
): Promise<MapResponse> {
  const params = new URLSearchParams({
    lat: String(filters.lat),
    lng: String(filters.lng),
    radiusM: String(filters.radiusM),
    limit: String(limit),
  });
  if (filters.category) params.set('category', filters.category);
  if (filters.cuisine) params.set('cuisine', filters.cuisine);
  if (filters.priceTier) params.set('priceTier', String(filters.priceTier));
  if (filters.ratingGte) params.set('ratingGte', String(filters.ratingGte));
  if (filters.crowdLevel) params.set('crowdLevel', filters.crowdLevel);
  if (filters.hasAvailability) params.set('hasAvailability', 'true');
  if (filters.adsHidden) params.set('adsHidden', 'true');
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(`/api/v1/map/venues?${params}`, { signal });
  if (!response.ok) throw new Error(`Không tải được địa điểm (${response.status}).`);
  return response.json() as Promise<MapResponse>;
}
