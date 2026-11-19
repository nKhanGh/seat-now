import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCheckInSummary, useCreateCheckIn } from '../api/checkInQueries';

export function CheckInPanel({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const summary = useCheckInSummary(slug);
  const create = useCreateCheckIn();
  const [message, setMessage] = useState('');

  function checkIn() {
    setMessage('');
    if (!navigator.geolocation) { setMessage('Trình duyệt không hỗ trợ vị trí.'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void create.mutateAsync({ slug, position: { lat: coords.latitude, lng: coords.longitude, accuracyM: coords.accuracy } })
          .then(() => setMessage('Đã ghi nhận check-in của bạn.'))
          .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Không thể check-in.'));
      },
      () => setMessage('Không lấy được vị trí. Hãy cấp quyền vị trí rồi thử lại.'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  return <section className="check-in-panel" aria-label="Check-in cộng đồng">
    <h2>Check-in cộng đồng</h2>
    {summary.isPending && <p className="small">Đang tải lượt check-in…</p>}
    {summary.isError && <p role="alert">{summary.error.message} <button onClick={() => void summary.refetch()}>Thử lại</button></p>}
    {summary.data && <p>{summary.data.lastHourUsers === 0 ? 'Chưa có check-in trong giờ qua.' : `${summary.data.lastHourUsers} người đã check-in trong giờ qua.`}</p>}
    <p className="small">Lượt check-in tự báo cáo, không thay thế tình trạng bàn trống.</p>
    {signedIn ? <button onClick={checkIn} disabled={create.isPending}>{create.isPending ? 'Đang ghi nhận…' : 'Check-in tại đây'}</button> : <Link to="/login">Đăng nhập để check-in</Link>}
    {message && <p role="status">{message}</p>}
  </section>;
}
