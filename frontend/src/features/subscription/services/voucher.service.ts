export type VoucherOffer = {
  id: string;
  venueSlug: string;
  venueName: string;
  title: string;
  discountText: string;
  startsAt: string;
  expiresAt: string;
  remaining: number;
  status: 'ACTIVE' | 'INACTIVE';
  claimed?: boolean;
};

export type MyVoucher = {
  id: string;
  code: string;
  status: 'CLAIMED' | 'REDEEMED';
  createdAt: string;
  redeemedAt: string | null;
  offer: VoucherOffer;
};

async function readData<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(' ') : body.message;
    throw new Error(message || `Không xử lý được voucher (${response.status}).`);
  }
  return ((await response.json()) as { data: T }).data;
}

export const voucherService = {
  offers: async (signal?: AbortSignal) =>
    readData<VoucherOffer[]>(await fetch('/api/v1/premium/vouchers', { signal, credentials: 'same-origin' })),
  mine: async (signal?: AbortSignal) =>
    readData<MyVoucher[]>(await fetch('/api/v1/me/vouchers', { signal, credentials: 'same-origin' })),
  claim: async (id: string) =>
    readData<{ code: string; offer: VoucherOffer }>(
      await fetch(`/api/v1/premium/vouchers/${encodeURIComponent(id)}/claim`, {
        method: 'POST',
        credentials: 'same-origin',
      }),
    ),
  adminOffers: async (signal?: AbortSignal) =>
    readData<VoucherOffer[]>(await fetch('/api/v1/admin/vouchers', { signal, credentials: 'same-origin' })),
  create: async (input: {
    venueSlug: string;
    title: string;
    discountText: string;
    stock: number;
    days: number;
  }) =>
    readData<VoucherOffer>(
      await fetch('/api/v1/admin/vouchers', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
    ),
  deactivate: async (id: string) =>
    readData<VoucherOffer>(
      await fetch(`/api/v1/admin/vouchers/${encodeURIComponent(id)}/deactivate`, {
        method: 'POST',
        credentials: 'same-origin',
      }),
    ),
  redeem: async (slug: string, code: string) =>
    readData<{ code: string; title: string; discountText: string; status: 'REDEEMED' }>(
      await fetch(`/api/v1/business/venues/${encodeURIComponent(slug)}/vouchers/redeem`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      }),
    ),
};
