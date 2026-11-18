export type ParkingFacilityItem = {
  id: string;
  slug: string;
  name: string;
  address: string;
  location: { type: 'Point'; coordinates: [number, number] };
  distanceM: number;
  relation: 'VENUE' | 'PARTNER' | 'PUBLIC';
  linkedToVenue: boolean;
  vehicleTypes: Array<'CAR' | 'MOTORBIKE'>;
  isOpenNow: boolean | null;
  entranceNote: string | null;
  pricing: { kind: 'FREE' | 'FLAT' | 'HOURLY' | 'TIERED' | 'UNKNOWN'; amountMinor: number | null; currency: string | null; unit: string | null; note: string | null };
  availability: {
    availableSpaces: number | null; totalSpaces: number | null;
    freshness: 'FRESH' | 'STALE' | 'UNKNOWN'; source: string | null;
    confidence: number | null; capturedAt: string | null; expiresAt: string | null;
    version: number | null;
  };
};

export type ParkingResponse = { data: ParkingFacilityItem[]; meta: { truncated: boolean; distanceType: 'STRAIGHT_LINE'; queryCenter: { lat: number; lng: number } } };

export async function getParkingForVenue(slug: string, signal?: AbortSignal): Promise<ParkingResponse> {
  const response = await fetch(`/api/v1/venues/${encodeURIComponent(slug)}/parking`, { signal });
  if (!response.ok) throw new Error(`Không tải được bãi đỗ xe (${response.status}).`);
  return response.json() as Promise<ParkingResponse>;
}
