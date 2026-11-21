import { AuthLink } from '../../auth/components/AuthLink';
import { useFavorites, useSetFavorite } from '../api/favoritesQueries';

export function FavoriteButton({ slug, userId }: { slug: string; userId: string | null }) {
  const favorites = useFavorites(userId);
  const update = useSetFavorite();
  if (!userId) return <AuthLink>Đăng nhập để lưu quán</AuthLink>;
  const saved = favorites.data?.some((item) => item.slug === slug) ?? false;
  return (
    <div className="favorite-action">
      <button
        onClick={() => update.mutate({ slug, saved: !saved })}
        disabled={favorites.isPending || update.isPending}
        aria-pressed={saved}
      >
        {saved ? '★ Đã lưu quán' : '☆ Lưu quán'}
      </button>
      {update.isError && <span role="alert">{update.error.message}</span>}
    </div>
  );
}
