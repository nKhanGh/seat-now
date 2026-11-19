export type BusinessClaim = { id: string; venueSlug: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string };
export type BusinessVenue = {
  slug: string; name: string; address: string; description: string; openingHours: string;
  menuSummary: string; priceTier: number; plan: 'FREE' | 'PREMIUM'; verified: boolean;
};
export type BusinessProfileInput = Pick<BusinessVenue, 'name' | 'address' | 'description' | 'openingHours' | 'menuSummary' | 'priceTier'>;

async function readData<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Không tải hoặc lưu được dữ liệu chủ quán (${response.status}).`);
  return (await response.json() as { data: T }).data;
}

export async function getMyClaims(signal?: AbortSignal): Promise<BusinessClaim[]> {
  return readData<BusinessClaim[]>(await fetch('/api/v1/business/claims/me', { signal, credentials: 'same-origin' }));
}

export async function getMyBusinessVenues(signal?: AbortSignal): Promise<BusinessVenue[]> {
  return readData<BusinessVenue[]>(await fetch('/api/v1/business/venues', { signal, credentials: 'same-origin' }));
}

export async function requestBusinessClaim(slug: string, evidence: string): Promise<BusinessClaim> {
  return readData<BusinessClaim>(await fetch(`/api/v1/business/claims/${encodeURIComponent(slug)}`, {
    method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ evidence }),
  }));
}

export async function updateBusinessProfile(slug: string, input: BusinessProfileInput): Promise<void> {
  await readData(await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/profile`, {
    method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  }));
}
