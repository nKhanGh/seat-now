export type VenueProposal = {
  id: string;
  slug: string;
  name: string;
  category: 'RESTAURANT' | 'CAFE' | 'CINEMA';
  cuisineTypes: string[];
  description: string;
  address: string;
  lat: number;
  lng: number;
  priceTier: number;
  status: 'PENDING' | 'READY_FOR_REVIEW';
  confirmationCount: number;
  confirmationsRequired: number;
  createdAt: string;
};

export type ProposalInput = {
  name: string;
  category: VenueProposal['category'];
  cuisineTypes: string[];
  description: string;
  address: string;
  lat: number;
  lng: number;
  priceTier: number;
};

export async function getProposals(signal?: AbortSignal): Promise<VenueProposal[]> {
  const response = await fetch('/api/v1/community/proposals', { signal });
  if (!response.ok) throw new Error(`Không tải được đề xuất (${response.status}).`);
  const body = (await response.json()) as { data: VenueProposal[] };
  return body.data;
}

export async function createProposal(input: ProposalInput): Promise<VenueProposal> {
  const response = await fetch('/api/v1/community/proposals', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Không tạo được đề xuất (${response.status}).`);
  const body = (await response.json()) as { data: VenueProposal };
  return body.data;
}

export async function confirmProposal(id: string): Promise<void> {
  const response = await fetch(`/api/v1/community/proposals/${encodeURIComponent(id)}/confirm`, {
    method: 'PUT',
    credentials: 'same-origin',
  });
  if (!response.ok) {
    if (response.status === 400) throw new Error('Bạn không thể tự xác nhận đề xuất của mình.');
    throw new Error(`Không xác nhận được đề xuất (${response.status}).`);
  }
}
