import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getFavorites, setFavorite } from '../services/favorites.service';

export const favoritesKey = ['community', 'favorites'] as const;

export function useFavorites(userId: string | null) {
  return useQuery({ queryKey: [...favoritesKey, userId], queryFn: ({ signal }) => getFavorites(signal), enabled: Boolean(userId), staleTime: 15_000 });
}

export function useSetFavorite() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, saved }: { slug: string; saved: boolean }) => setFavorite(slug, saved),
    onSuccess: () => client.invalidateQueries({ queryKey: favoritesKey }),
  });
}
