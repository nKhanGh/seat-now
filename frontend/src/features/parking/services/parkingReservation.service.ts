export type ParkingReservation = {
  id: string;
  venueSlug: string;
  facilitySlug: string;
  facilityName?: string;
  vehicleType: 'CAR' | 'MOTORBIKE';
  startsAt: string;
  endsAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELED' | 'COMPLETED';
  createdAt: string;
  resolvedAt: string | null;
};

export type OwnedParkingFacility = {
  slug: string;
  name: string;
  totalSpaces: number | null;
  availableSpaces: number | null;
  expiresAt: string | null;
};

async function readData<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(' ') : body.message;
    throw new Error(message || `Không xử lý được chỗ xe (${response.status}).`);
  }
  return ((await response.json()) as { data: T }).data;
}

export const parkingReservationService = {
  create: async (
    slug: string,
    facilitySlug: string,
    input: { vehicleType: 'CAR' | 'MOTORBIKE'; startsAt: string; endsAt: string },
  ) =>
    readData<ParkingReservation>(
      await fetch(
        `/api/v1/venues/${encodeURIComponent(slug)}/parking/${encodeURIComponent(facilitySlug)}/reservations`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      ),
    ),
  mine: async (signal?: AbortSignal) =>
    readData<ParkingReservation[]>(
      await fetch('/api/v1/me/parking-reservations', { signal, credentials: 'same-origin' }),
    ),
  cancel: async (id: string) =>
    readData<ParkingReservation>(
      await fetch(`/api/v1/me/parking-reservations/${encodeURIComponent(id)}/cancel`, {
        method: 'POST',
        credentials: 'same-origin',
      }),
    ),
  forVenue: async (slug: string, signal?: AbortSignal) =>
    readData<ParkingReservation[]>(
      await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/parking-reservations`, {
        signal,
        credentials: 'same-origin',
      }),
    ),
  ownedFacilities: async (slug: string, signal?: AbortSignal) =>
    readData<OwnedParkingFacility[]>(
      await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/parking-facilities`, {
        signal,
        credentials: 'same-origin',
      }),
    ),
  updateAvailability: async (
    slug: string,
    facilitySlug: string,
    input: { totalSpaces: number; availableSpaces: number },
  ) =>
    readData<{ facilitySlug: string; totalSpaces: number; availableSpaces: number }>(
      await fetch(
        `/api/v1/business/venues/${encodeURIComponent(slug)}/parking-facilities/${encodeURIComponent(facilitySlug)}/availability`,
        {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        },
      ),
    ),
  resolve: async (slug: string, id: string, action: 'confirm' | 'decline' | 'complete') =>
    readData<ParkingReservation>(
      await fetch(
        `/api/v1/business/venues/${encodeURIComponent(slug)}/parking-reservations/${encodeURIComponent(id)}/${action}`,
        { method: 'POST', credentials: 'same-origin' },
      ),
    ),
};
