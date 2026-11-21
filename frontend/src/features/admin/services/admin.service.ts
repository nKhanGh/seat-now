import type { VenueProposal } from '../../community/services/proposals.service';

export type PendingBusinessClaim = {
  id: string;
  venueSlug: string;
  venueName: string;
  userId: string;
  applicant: { id: string; displayName: string; email: string } | null;
  evidence: string;
  hasDocument: boolean;
  status: 'PENDING';
  createdAt: string;
};

export type ReadyProposal = VenueProposal & {
  status: 'READY_FOR_REVIEW';
  applicant: { id: string; displayName: string; email: string } | null;
};

export type ReadyProposalQueue = {
  data: ReadyProposal[];
  meta: { truncated: boolean };
};

async function readData<T>(response: Response): Promise<T> {
  if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn.');
  if (response.status === 403) throw new Error('Tài khoản này không có quyền xét duyệt.');
  if (!response.ok) throw new Error(`Không xử lý được yêu cầu (${response.status}).`);
  return ((await response.json()) as { data: T }).data;
}

export async function getPendingClaims(signal?: AbortSignal): Promise<PendingBusinessClaim[]> {
  return readData<PendingBusinessClaim[]>(
    await fetch('/api/v1/admin/business/claims', { signal, credentials: 'same-origin', cache: 'no-store' }),
  );
}

export async function decideClaim(id: string, action: 'approve' | 'reject'): Promise<void> {
  await readData(
    await fetch(`/api/v1/admin/business/claims/${encodeURIComponent(id)}/${action}`, {
      method: 'POST',
      credentials: 'same-origin',
    }),
  );
}

export async function getReadyProposals(signal?: AbortSignal): Promise<ReadyProposalQueue> {
  const response = await fetch('/api/v1/admin/community/proposals', {
    signal,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (response.status === 401) throw new Error('Phiên đăng nhập đã hết hạn.');
  if (response.status === 403) throw new Error('Tài khoản này không có quyền xét duyệt.');
  if (!response.ok) throw new Error(`Không tải được đề xuất (${response.status}).`);
  return (await response.json()) as ReadyProposalQueue;
}

export async function decideProposal(id: string, action: 'approve' | 'reject'): Promise<void> {
  await readData(
    await fetch(`/api/v1/admin/community/proposals/${encodeURIComponent(id)}/${action}`, {
      method: 'POST',
      credentials: 'same-origin',
    }),
  );
}
