import { Link, useParams } from 'react-router-dom';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useFollowingStatus, usePublicProfile, useSetFollow } from '../api/followsQueries';
import { useUserReviews } from '../api/reviewsQueries';

export function PublicProfilePage() {
  const id = useParams().id ?? '';
  const auth = useCurrentUser();
  const profile = usePublicProfile(id);
  const status = useFollowingStatus(auth.data?.id ?? null, id);
  const update = useSetFollow();
  const reviews = useUserReviews(id, Boolean(profile.data));
  const reviewItems = reviews.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <main className="plans-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      {profile.isPending && <p>Đang tải hồ sơ…</p>}
      {profile.isError && (
        <p role="alert">
          {profile.error.message} <Link to="/">Về bản đồ</Link>
        </p>
      )}
      {profile.data && (
        <section className="card profile-card">
          <h1>{profile.data.displayName}</h1>
          <p>{profile.data.followers} người theo dõi</p>
          {!auth.isPending && !auth.data && <AuthLink>Đăng nhập để theo dõi</AuthLink>}
          {auth.data?.id === id && <p>Đây là hồ sơ công khai của bạn.</p>}
          {auth.data && auth.data.id !== id && (
            <button
              disabled={status.isPending || status.isError || update.isPending}
              onClick={() => update.mutate({ id, following: !status.data })}
            >
              {status.data ? 'Bỏ theo dõi' : 'Theo dõi'}
            </button>
          )}
          {status.isError && <p role="alert">{status.error.message}</p>}
          {update.isError && <p role="alert">{update.error.message}</p>}
        </section>
      )}
      {profile.data && (
        <section className="profile-reviews" aria-label="Đánh giá công khai của thành viên">
          <h2>Đánh giá công khai</h2>
          {reviews.isPending && <p>Đang tải đánh giá…</p>}
          {reviews.isError && (
            <p role="alert">
              {reviews.error.message} <button onClick={() => void reviews.refetch()}>Thử lại</button>
            </p>
          )}
          {reviews.data && reviewItems.length === 0 && <p>Thành viên chưa có đánh giá công khai.</p>}
          {reviewItems.map((review) => (
            <article key={review.id} className="card profile-review-card">
              <h3>{review.venueName}</h3>
              <p>
                ★ {review.rating}/5 · {new Date(review.createdAt).toLocaleDateString('vi-VN')}
              </p>
              {review.body && <p>{review.body}</p>}
              {review.photoUrl && (
                <img
                  className="review-photo"
                  src={review.photoUrl}
                  alt={`Ảnh đánh giá tại ${review.venueName}`}
                  loading="lazy"
                />
              )}
              {review.venueLocation && (
                <Link
                  to={`/?lat=${review.venueLocation.coordinates[1]}&lng=${review.venueLocation.coordinates[0]}&venue=${encodeURIComponent(review.venueSlug)}`}
                >
                  Xem quán trên bản đồ
                </Link>
              )}
            </article>
          ))}
          {reviews.hasNextPage && (
            <button onClick={() => void reviews.fetchNextPage()} disabled={reviews.isFetchingNextPage}>
              {reviews.isFetchingNextPage ? 'Đang tải…' : 'Xem thêm đánh giá'}
            </button>
          )}
        </section>
      )}
    </main>
  );
}
