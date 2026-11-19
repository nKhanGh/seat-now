export type BusinessClaim = {
  id: string;
  venueSlug: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
};
export type BusinessVenue = {
  slug: string;
  name: string;
  category: 'RESTAURANT' | 'CAFE' | 'CINEMA';
  address: string;
  description: string;
  openingHours: string;
  menuSummary: string;
  priceTier: number;
  plan: 'FREE' | 'PREMIUM';
  verified: boolean;
  logoUrl: string | null;
  coverUrl: string | null;
  promotion: { text: string; startsAt: string; endsAt: string; sponsored: boolean } | null;
};
export type CampaignInput = { promotionText: string; startsAt: string; endsAt: string; sponsored: boolean };
export type BusinessProfileInput = Pick<
  BusinessVenue,
  'name' | 'address' | 'description' | 'openingHours' | 'menuSummary' | 'priceTier'
>;
export type ManualAvailabilityInput = {
  tables?: { total: number; available: number };
  seats?: { total: number; available: number };
  crowdLevel: 'QUIET' | 'MODERATE' | 'BUSY' | 'FULL';
  estimatedWaitMinutes: number;
  acceptingGuests: boolean;
};
export type BusinessDashboard = {
  periodDays: number;
  views: { total: number; byHour: Array<{ hourUtc: number; count: number }>; truncated: boolean };
  occupancy: {
    averagePercent: number | null;
    samples: number;
    sourceCounts: { DEMO: number; OPERATOR: number; POS: number };
    peakHours: Array<{ hourUtc: number; averagePercent: number; samples: number }>;
    truncated: boolean;
  };
};

async function readData<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`Không tải hoặc lưu được dữ liệu chủ quán (${response.status}).`);
  return ((await response.json()) as { data: T }).data;
}

export async function getMyClaims(signal?: AbortSignal): Promise<BusinessClaim[]> {
  return readData<BusinessClaim[]>(
    await fetch('/api/v1/business/claims/me', { signal, credentials: 'same-origin' }),
  );
}

export async function getMyBusinessVenues(signal?: AbortSignal): Promise<BusinessVenue[]> {
  return readData<BusinessVenue[]>(
    await fetch('/api/v1/business/venues', { signal, credentials: 'same-origin' }),
  );
}

export async function requestBusinessClaim(slug: string, evidence: string): Promise<BusinessClaim> {
  return readData<BusinessClaim>(
    await fetch(`/api/v1/business/claims/${encodeURIComponent(slug)}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evidence }),
    }),
  );
}

export async function updateBusinessProfile(slug: string, input: BusinessProfileInput): Promise<void> {
  await readData(
    await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/profile`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function updateManualAvailability(slug: string, input: ManualAvailabilityInput): Promise<void> {
  await readData(
    await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/availability`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function uploadBusinessLogo(slug: string, file: File): Promise<void> {
  const form = new FormData();
  form.set('logo', file);
  await readData(
    await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/logo`, {
      method: 'POST',
      credentials: 'same-origin',
      body: form,
    }),
  );
}

export async function uploadBusinessCover(slug: string, file: File): Promise<void> {
  const form = new FormData();
  form.set('cover', file);
  await readData(
    await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/cover`, {
      method: 'POST',
      credentials: 'same-origin',
      body: form,
    }),
  );
}

export async function getBusinessDashboard(slug: string, signal?: AbortSignal): Promise<BusinessDashboard> {
  return readData<BusinessDashboard>(
    await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/dashboard`, {
      credentials: 'same-origin',
      signal,
    }),
  );
}

export async function updateCampaign(slug: string, input: CampaignInput): Promise<void> {
  await readData(
    await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/campaign`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function clearCampaign(slug: string): Promise<void> {
  await readData(
    await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/campaign`, {
      method: 'DELETE',
      credentials: 'same-origin',
    }),
  );
}
