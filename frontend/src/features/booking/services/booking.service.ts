export type BookingRequest = {
  id: string;
  venueSlug: string;
  venueName?: string;
  venueLocation?: { type: 'Point'; coordinates: [number, number] } | null;
  requestedAt: string;
  guestCount: number;
  note: string;
  priority: boolean;
  status: 'PENDING' | 'CONFIRMED' | 'DECLINED' | 'CANCELED' | 'COMPLETED';
  createdAt: string;
  resolvedAt: string | null;
  completedAt: string | null;
  guestDisplayName?: string;
};

async function readData<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = body?.message;
    throw new Error(
      Array.isArray(message) ? message.join(', ') : (message ?? `Lỗi đặt chỗ (${response.status}).`),
    );
  }
  return ((await response.json()) as { data: T }).data;
}

const venuePath = (slug: string) => `/api/v1/venues/${encodeURIComponent(slug)}`;
const businessPath = (slug: string) => `/api/v1/business/venues/${encodeURIComponent(slug)}`;

export async function getBookingStatus(slug: string, signal?: AbortSignal) {
  return readData<{ enabled: boolean }>(await fetch(`${venuePath(slug)}/booking-status`, { signal }));
}

export async function createBooking(
  slug: string,
  input: { requestedAt: string; guestCount: number; note: string },
) {
  return readData<BookingRequest>(
    await fetch(`${venuePath(slug)}/bookings`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }),
  );
}

export async function getMyBookings(signal?: AbortSignal) {
  return readData<BookingRequest[]>(
    await fetch('/api/v1/me/bookings', { signal, credentials: 'same-origin' }),
  );
}

export async function cancelBooking(id: string) {
  return readData<BookingRequest>(
    await fetch(`/api/v1/me/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
      credentials: 'same-origin',
    }),
  );
}

export async function getVenueBookings(slug: string, signal?: AbortSignal) {
  return readData<BookingRequest[]>(
    await fetch(`${businessPath(slug)}/bookings`, { signal, credentials: 'same-origin' }),
  );
}

export async function setBookingEnabled(slug: string, enabled: boolean) {
  return readData<{ enabled: boolean }>(
    await fetch(`${businessPath(slug)}/booking-settings`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    }),
  );
}

export async function resolveBooking(
  slug: string,
  id: string,
  status: 'CONFIRMED' | 'DECLINED' | 'COMPLETED',
) {
  return readData<BookingRequest>(
    await fetch(`${businessPath(slug)}/bookings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }),
  );
}
