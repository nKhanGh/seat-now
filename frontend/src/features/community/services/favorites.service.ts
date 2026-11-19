export type FavoriteVenue = {
  slug: string;
  name: string;
  category: string;
  address: string;
  location: { type: 'Point'; coordinates: [number, number] };
  priceTier: number;
  rating: number;
  savedAt: string;
};

export async function getFavorites(signal?: AbortSignal): Promise<FavoriteVenue[]> {
  const response = await fetch('/api/v1/me/favorites', { signal, credentials: 'same-origin' });
  if (!response.ok) throw new Error(`Không tải được quán đã lưu (${response.status}).`);
  const body = (await response.json()) as { data: FavoriteVenue[] };
  return body.data;
}

export async function setFavorite(slug: string, saved: boolean): Promise<void> {
  const response = await fetch(`/api/v1/me/favorites/${encodeURIComponent(slug)}`, {
    method: saved ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Không cập nhật được quán yêu thích (${response.status}).`);
}
