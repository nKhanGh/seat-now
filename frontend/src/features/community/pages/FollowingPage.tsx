import { Link } from 'react-router-dom';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useFollowingList, useFollowingReviews } from '../api/followsQueries';

export function FollowingPage() {
  const auth = useCurrentUser();
  const following = useFollowingList(auth.data?.id ?? null);
  const feed = useFollowingReviews(auth.data?.id ?? null);
  return (
    <main className="plans-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <h1>Đang theo dõi</h1>
      {auth.isPending && <p>Đang kiểm tra đăng nhập…</p>}
      {!auth.isPending && !auth.data && (
        <p>
          <AuthLink>Đăng nhập</AuthLink> để xem danh sách của bạn.
        </p>
      )}
      {following.isPending && auth.data && <p>Đang tải danh sách…</p>}
      {following.isError && (
        <p role="alert">
          {following.error.message} <button onClick={() => void following.refetch()}>Thử lại</button>
        </p>
      )}
      {following.data?.data.length === 0 && <p>Bạn chưa theo dõi ai.</p>}
      {following.data?.data.map((person) => (
        <article key={person.id} className="card favorite-card">
          <Link to={`/users/${person.id}`}>{person.displayName}</Link>
        </article>
      ))}
      {following.data?.meta.truncated && <p>Đang hiển thị 100 tài khoản đầu tiên.</p>}
      {auth.data && (
        <section className="following-feed" aria-label="Review mới từ người đang theo dõi">
          <h2>Review mới từ người đang theo dõi</h2>
          {feed.isPending && <p>Đang tải hoạt động mới…</p>}
          {feed.isError && (
            <p role="alert">
              {feed.error.message} <button onClick={() => void feed.refetch()}>Thử lại</button>
            </p>
          )}
          {feed.data?.data.length === 0 && (
            <p>
              {following.data?.data.length === 0
                ? 'Theo dõi một thành viên để xem review mới của họ.'
                : 'Những người bạn theo dõi chưa có review công khai.'}
            </p>
          )}
          {feed.data?.data.map((review) => (
            <article key={review.id} className="card feed-review-card">
              <p>
                <Link to={`/users/${review.author.id}`}>{review.author.displayName}</Link> đánh giá{' '}
                <strong>{review.venueName}</strong>
              </p>
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
          {feed.data?.meta.truncated && <p className="small">Đang hiển thị 20 review mới nhất.</p>}
          {feed.data?.meta.followingTruncated && (
            <p className="small">Hoạt động lấy từ 100 tài khoản theo dõi gần nhất.</p>
          )}
        </section>
      )}
    </main>
  );
}
