export type VenueReview = {
  id: string;
  rating: number;
  body: string;
  author: { id: string; displayName: string };
  createdAt: string;
  updatedAt: string;
  photoUrl: string | null;
};
export type ReviewsPage = { data: VenueReview[]; meta: { nextCursor: string | null } };
export type UserReview = Pick<VenueReview, 'id' | 'rating' | 'body' | 'createdAt' | 'photoUrl'> & {
  venueSlug: string;
  venueName: string;
  venueLocation: { type: 'Point'; coordinates: [number, number] } | null;
};
export type UserReviewsPage = { data: UserReview[]; meta: { nextCursor: string | null } };
export type MyReview = Pick<VenueReview, 'id' | 'rating' | 'body' | 'photoUrl'>;

export async function getMyReview(slug: string, signal?: AbortSignal): Promise<MyReview | null> {
  const response = await fetch(`/api/v1/me/reviews/${encodeURIComponent(slug)}`, {
    signal,
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Không tải được đánh giá của bạn (${response.status}).`);
  return ((await response.json()) as { data: MyReview | null }).data;
}

export async function getReviews(
  slug: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<ReviewsPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(`/api/v1/venues/${encodeURIComponent(slug)}/reviews?${params}`, { signal });
  if (!response.ok) throw new Error(`Không tải được review (${response.status}).`);
  return response.json() as Promise<ReviewsPage>;
}

export async function getUserReviews(
  id: string,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<UserReviewsPage> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const response = await fetch(`/api/v1/users/${encodeURIComponent(id)}/reviews?${params}`, { signal });
  if (!response.ok) throw new Error(`Không tải được đánh giá công khai (${response.status}).`);
  return response.json() as Promise<UserReviewsPage>;
}

export async function saveReview(slug: string, input: { rating: number; body: string }): Promise<void> {
  const response = await fetch(`/api/v1/me/reviews/${encodeURIComponent(slug)}`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`Không lưu được review (${response.status}).`);
}

export async function removeReview(slug: string): Promise<void> {
  const response = await fetch(`/api/v1/me/reviews/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Không xóa được review (${response.status}).`);
}

export async function uploadReviewPhoto(slug: string, file: File): Promise<void> {
  const form = new FormData();
  form.set('photo', file);
  const response = await fetch(`/api/v1/me/reviews/${encodeURIComponent(slug)}/photo`, {
    method: 'POST',
    credentials: 'same-origin',
    body: form,
  });
  if (!response.ok)
    throw new Error(
      `Không tải được ảnh review (${response.status}). Chỉ nhận JPEG, PNG hoặc WebP tối đa 2 MB.`,
    );
}

export async function reportReview(id: string, reason: 'SPAM' | 'ABUSE' | 'OTHER'): Promise<void> {
  const response = await fetch(`/api/v1/reviews/${encodeURIComponent(id)}/reports`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  if (!response.ok) throw new Error(`Không gửi được báo cáo (${response.status}).`);
}
