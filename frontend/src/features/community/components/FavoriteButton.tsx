import { Link } from 'react-router-dom';
import { useFavorites, useSetFavorite } from '../api/favoritesQueries';

export function FavoriteButton({ slug, userId }: { slug: string; userId: string | null }) {
  const favorites = useFavorites(userId);
  const update = useSetFavorite();
  if (!userId) return <Link to="/login">Đăng nhập để lưu quán</Link>;
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
