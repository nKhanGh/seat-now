import { useState } from 'react';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCheckInSummary, useCreateCheckIn } from '../api/checkInQueries';

const activityLabels = {
  NONE: 'Chưa đủ dữ liệu cộng đồng để nhận xét độ đông.',
  LOW: 'Tín hiệu cộng đồng: ít người ghé trong giờ qua.',
  MODERATE: 'Tín hiệu cộng đồng: có người ghé trong giờ qua.',
  HIGH: 'Tín hiệu cộng đồng: nhiều người ghé trong giờ qua.',
} as const;

export function CheckInPanel({ slug, signedIn }: { slug: string; signedIn: boolean }) {
  const summary = useCheckInSummary(slug);
  const create = useCreateCheckIn();
  const [message, setMessage] = useState('');

  function checkIn() {
    setMessage('');
    if (!navigator.geolocation) {
      setMessage('Trình duyệt không hỗ trợ vị trí.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        void create
          .mutateAsync({
            slug,
            position: { lat: coords.latitude, lng: coords.longitude, accuracyM: coords.accuracy },
          })
          .then(() => setMessage('Đã ghi nhận check-in của bạn.'))
          .catch((error: unknown) =>
            setMessage(error instanceof Error ? error.message : 'Không thể check-in.'),
          );
      },
      () => setMessage('Không lấy được vị trí. Hãy cấp quyền vị trí rồi thử lại.'),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
    );
  }

  return (
    <section className="check-in-panel" aria-label="Check-in cộng đồng">
      <h2>Check-in cộng đồng</h2>
      {summary.isPending && <p className="small">Đang tải lượt check-in…</p>}
      {summary.isError && (
        <p role="alert">
          {summary.error.message} <button onClick={() => void summary.refetch()}>Thử lại</button>
        </p>
      )}
      {summary.data && (
        <>
          <p>
            {summary.data.lastHourUsers === 0
              ? 'Chưa có check-in trong giờ qua.'
              : `${summary.data.lastHourUsers} người đã check-in trong giờ qua.`}
          </p>
          <p className="community-activity">{activityLabels[summary.data.activitySignal]}</p>
        </>
      )}
      <p className="small">
        Ước lượng từ check-in tự báo cáo, chỉ để đối chiếu độ đông ở trên; không thay thế số bàn trống.
      </p>
      {signedIn ? (
        <button onClick={checkIn} disabled={create.isPending}>
          {create.isPending ? 'Đang ghi nhận…' : 'Check-in tại đây'}
        </button>
      ) : (
        <AuthLink>Đăng nhập để check-in</AuthLink>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  );
}
