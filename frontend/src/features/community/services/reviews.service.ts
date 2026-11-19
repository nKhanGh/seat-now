export type VenueReview = {
  id: string; rating: number; body: string;
  author: { id: string; displayName: string };
  createdAt: string; updatedAt: string;
  photoUrl: string | null;
};
export type ReviewsPage = { data: VenueReview[]; meta: { nextCursor: string | null } };

export async function getReviews(slug: string, cursor: string | null, signal?: AbortSignal): Promise<ReviewsPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(`/api/v1/venues/${encodeURIComponent(slug)}/reviews?${params}`, { signal });
  if (!response.ok) throw new Error(`Không tải được review (${response.status}).`);
  return response.json() as Promise<ReviewsPage>;
}

export async function saveReview(slug: string, input: { rating: number; body: string }): Promise<void> {
  const response = await fetch(`/api/v1/me/reviews/${encodeURIComponent(slug)}`, {
    method: 'PUT', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Không lưu được review (${response.status}).`);
}

export async function removeReview(slug: string): Promise<void> {
  const response = await fetch(`/api/v1/me/reviews/${encodeURIComponent(slug)}`, { method: 'DELETE', credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Không xóa được review (${response.status}).`);
}

export async function uploadReviewPhoto(slug: string, file: File): Promise<void> {
  const form = new FormData();
  form.set('photo', file);
  const response = await fetch(`/api/v1/me/reviews/${encodeURIComponent(slug)}/photo`, {
    method: 'POST', credentials: 'same-origin', body: form,
  });
  if (!response.ok) throw new Error(`Không tải được ảnh review (${response.status}). Chỉ nhận JPEG, PNG hoặc WebP tối đa 2 MB.`);
}
