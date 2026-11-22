export type Recommendation = {
  slug: string;
  name: string;
  address: string;
  category: 'RESTAURANT' | 'CAFE' | 'CINEMA';
  cuisineTypes: string[];
  rating: number;
  priceTier: number;
  distanceM: number;
  reasons: string[];
};

export type RecommendationPreferences = {
  lat: number;
  lng: number;
  cuisine: string;
  maxPriceTier: number;
  partySize: number;
};

export async function getRecommendations(preferences: RecommendationPreferences, signal?: AbortSignal) {
  const params = new URLSearchParams({
    lat: String(preferences.lat),
    lng: String(preferences.lng),
    partySize: String(preferences.partySize),
  });
  if (preferences.cuisine) params.set('cuisine', preferences.cuisine);
  if (preferences.maxPriceTier) params.set('maxPriceTier', String(preferences.maxPriceTier));
  const response = await fetch(`/api/v1/me/recommendations?${params}`, {
    credentials: 'same-origin',
    signal,
  });
  if (response.status === 403) throw new Error('Tính năng này cần Premium demo còn hiệu lực.');
  if (!response.ok) throw new Error(`Không tải được gợi ý (${response.status}).`);
  return (await response.json()) as {
    data: Recommendation[];
    meta: { method: 'RULE_BASED'; radiusM: number; basedOnHistory: boolean };
  };
}
