import { Link } from 'react-router-dom';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useCancelBooking, useMyBookings } from '../api/bookingQueries';

const statusLabel = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DECLINED: 'Quán từ chối',
  CANCELED: 'Đã hủy',
};

export function MyBookingsPage() {
  const auth = useCurrentUser();
  const userId = auth.data?.id ?? null;
  const bookings = useMyBookings(userId);
  const cancel = useCancelBooking(userId);
  return (
    <main className="plans-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <h1>Yêu cầu đặt bàn của tôi</h1>
      {!auth.isPending && !userId && (
        <p>
          <AuthLink>Đăng nhập</AuthLink> để xem yêu cầu.
        </p>
      )}
      {bookings.isPending && userId && <p>Đang tải yêu cầu…</p>}
      {bookings.isError && <p role="alert">{bookings.error.message}</p>}
      {bookings.data?.length === 0 && <p>Chưa có yêu cầu nào.</p>}
      {bookings.data?.map((booking) => (
        <section key={booking.id} className="card booking-card">
          <h2>{booking.venueName ?? booking.venueSlug}</h2>
          {booking.venueLocation && (
            <Link
              to={`/?lat=${booking.venueLocation.coordinates[1]}&lng=${booking.venueLocation.coordinates[0]}&venue=${encodeURIComponent(booking.venueSlug)}`}
            >
              Xem quán trên bản đồ
            </Link>
          )}
          <p>
            {new Date(booking.requestedAt).toLocaleString('vi-VN')} · {booking.guestCount} khách
          </p>
          <p>
            {statusLabel[booking.status]}
            {booking.priority && ' · Ưu tiên Premium'}
          </p>
          {booking.note && <p>Ghi chú: {booking.note}</p>}
          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') && (
            <button disabled={cancel.isPending} onClick={() => cancel.mutate(booking.id)}>
              Hủy yêu cầu
            </button>
          )}
        </section>
      ))}
      {cancel.isError && <p role="alert">{cancel.error.message}</p>}
    </main>
  );
}
