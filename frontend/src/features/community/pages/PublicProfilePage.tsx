import { Link, useParams } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useFollowingStatus, usePublicProfile, useSetFollow } from '../api/followsQueries';

export function PublicProfilePage() {
  const id = useParams().id ?? '';
  const auth = useCurrentUser();
  const profile = usePublicProfile(id);
  const status = useFollowingStatus(auth.data?.id ?? null, id);
  const update = useSetFollow();

  return <main className="plans-page">
    <Link to="/" className="brand">SeatNow</Link>
    {profile.isPending && <p>Đang tải hồ sơ…</p>}
    {profile.isError && <p role="alert">{profile.error.message} <Link to="/">Về bản đồ</Link></p>}
    {profile.data && <section className="card profile-card">
      <h1>{profile.data.displayName}</h1>
      <p>{profile.data.followers} người theo dõi</p>
      {!auth.isPending && !auth.data && <Link to="/login">Đăng nhập để theo dõi</Link>}
      {auth.data?.id === id && <p>Đây là hồ sơ công khai của bạn.</p>}
      {auth.data && auth.data.id !== id && <button disabled={status.isPending || status.isError || update.isPending} onClick={() => update.mutate({ id, following: !status.data })}>
        {status.data ? 'Bỏ theo dõi' : 'Theo dõi'}
      </button>}
      {status.isError && <p role="alert">{status.error.message}</p>}
      {update.isError && <p role="alert">{update.error.message}</p>}
    </section>}
  </main>;
}
