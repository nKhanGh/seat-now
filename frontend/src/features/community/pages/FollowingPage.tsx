import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useFollowingList } from '../api/followsQueries';

export function FollowingPage() {
  const auth = useCurrentUser();
  const following = useFollowingList(auth.data?.id ?? null);
  return (
    <main className="plans-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <h1>Đang theo dõi</h1>
      {auth.isPending && <p>Đang kiểm tra đăng nhập…</p>}
      {!auth.isPending && !auth.data && (
        <p>
          <Link to="/login">Đăng nhập</Link> để xem danh sách của bạn.
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
    </main>
  );
}
