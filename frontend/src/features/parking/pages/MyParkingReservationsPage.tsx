import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCancelParkingReservation, useMyParkingReservations } from '../api/parkingReservationQueries';

const statusLabels = {
  PENDING: 'Chờ chủ quán xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DECLINED: 'Bị từ chối',
  CANCELED: 'Đã hủy',
  COMPLETED: 'Đã nhận xe',
};

export function MyParkingReservationsPage() {
  const auth = useCurrentUser();
  const reservations = useMyParkingReservations(Boolean(auth.data));
  const cancel = useCancelParkingReservation();
  const [cancelId, setCancelId] = useState<string | null>(null);
  return (
    <main className="plans-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <h1>Yêu cầu giữ xe của tôi</h1>
      <p className="small">
        Chỗ xe chỉ được giữ trong bản demo sau khi chủ quán xác nhận. Không dùng để đi đến bãi thật.
      </p>
      {!auth.isPending && !auth.data && (
        <p>
          <AuthLink>Đăng nhập</AuthLink> để xem yêu cầu.
        </p>
      )}
      {reservations.isPending && auth.data && <p>Đang tải yêu cầu…</p>}
      {reservations.isError && (
        <p role="alert" className="error">
          {reservations.error.message} <button onClick={() => void reservations.refetch()}>Thử lại</button>
        </p>
      )}
      {reservations.data?.length === 0 && <p>Bạn chưa gửi yêu cầu giữ xe nào.</p>}
      {reservations.data?.map((item) => (
        <article className="card booking-card" key={item.id}>
          <h2>{item.facilityName ?? item.facilitySlug}</h2>
          <p>
            {new Date(item.startsAt).toLocaleString('vi-VN')} –{' '}
            {new Date(item.endsAt).toLocaleString('vi-VN')} · {item.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'}
          </p>
          <strong>{statusLabels[item.status]}</strong>
          {['PENDING', 'CONFIRMED'].includes(item.status) &&
            new Date(item.startsAt) > new Date() &&
            (cancelId === item.id ? (
              <div className="booking-cancel-confirm">
                <p>Hủy yêu cầu giữ xe này?</p>
                <div>
                  <button type="button" onClick={() => setCancelId(null)}>
                    Giữ nguyên
                  </button>
                  <button
                    type="button"
                    className="booking-cancel-danger"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(item.id, { onSuccess: () => setCancelId(null) })}
                  >
                    Xác nhận hủy
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="booking-action" onClick={() => setCancelId(item.id)}>
                Hủy yêu cầu
              </button>
            ))}
          {cancel.isError && cancelId === item.id && (
            <p role="alert" className="error">
              {cancel.error.message}
            </p>
          )}
        </article>
      ))}
    </main>
  );
}
