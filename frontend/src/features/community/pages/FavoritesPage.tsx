import { Link } from 'react-router-dom';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useFavorites, useSetFavorite } from '../api/favoritesQueries';
import { ratingLabel } from '../../map/services/ratingLabel';
import { priceTierLabel } from '../../../shared/priceTier';

export function FavoritesPage() {
  const auth = useCurrentUser();
  const favorites = useFavorites(auth.data?.id ?? null);
  const update = useSetFavorite();
  return (
    <main className="plans-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <h1>Quán đã lưu</h1>
      {auth.isPending && <p>Đang kiểm tra đăng nhập…</p>}
      {!auth.isPending && !auth.data && (
        <p>
          <AuthLink>Đăng nhập</AuthLink> để xem danh sách của bạn.
        </p>
      )}
      {auth.data && favorites.isPending && <p>Đang tải quán đã lưu…</p>}
      {favorites.isError && (
        <p role="alert">
          {favorites.error.message} <button onClick={() => void favorites.refetch()}>Thử lại</button>
        </p>
      )}
      {favorites.data?.length === 0 && <p>Bạn chưa lưu địa điểm nào.</p>}
      {favorites.data?.map((venue) => (
        <article key={venue.slug} className="card favorite-card">
          <h2>{venue.name}</h2>
          <p>{venue.address}</p>
          <p>
            {ratingLabel(venue.rating)} · Giá: {priceTierLabel(venue.priceTier)}
          </p>
          <div className="favorite-actions">
            <Link
              to={`/?lat=${venue.location.coordinates[1]}&lng=${venue.location.coordinates[0]}&venue=${encodeURIComponent(venue.slug)}`}
            >
              Xem trên bản đồ
            </Link>
            <button
              disabled={update.isPending}
              onClick={() => update.mutate({ slug: venue.slug, saved: false })}
            >
              Bỏ lưu
            </button>
          </div>
        </article>
      ))}
    </main>
  );
}
