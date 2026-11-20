import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useCancelBooking, useMyBookings } from '../api/bookingQueries';
import { BookingRequest } from '../services/booking.service';

const statusLabel = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  DECLINED: 'Quán từ chối',
  CANCELED: 'Đã hủy',
};
type BookingView = 'ALL' | 'PENDING' | 'CONFIRMED' | 'CLOSED';
const bookingViews: Array<{ value: BookingView; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PENDING', label: 'Chờ xác nhận' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'CLOSED', label: 'Đã kết thúc' },
];

function inView(booking: BookingRequest, view: BookingView) {
  return (
    view === 'ALL' ||
    booking.status === view ||
    (view === 'CLOSED' && (booking.status === 'DECLINED' || booking.status === 'CANCELED'))
  );
}

export function MyBookingsPage() {
  const auth = useCurrentUser();
  const userId = auth.data?.id ?? null;
  const bookings = useMyBookings(userId);
  const cancel = useCancelBooking(userId);
  const [view, setView] = useState<BookingView>('ALL');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const visibleBookings = bookings.data?.filter((booking) => inView(booking, view)) ?? [];
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
      {bookings.isError && (
        <p role="alert">
          {bookings.error.message} <button onClick={() => void bookings.refetch()}>Thử lại</button>
        </p>
      )}
      {bookings.data && bookings.data.length > 0 && (
        <div className="booking-filters" aria-label="Lọc lịch sử đặt bàn">
          {bookingViews.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={view === option.value}
              onClick={() => {
                setView(option.value);
                setCancelId(null);
                cancel.reset();
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
      {bookings.data?.length === 0 && <p>Chưa có yêu cầu nào.</p>}
      {bookings.data && bookings.data.length > 0 && visibleBookings.length === 0 && (
        <p>Không có yêu cầu ở trạng thái này.</p>
      )}
      {visibleBookings.map((booking) => (
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
          {(booking.status === 'PENDING' || booking.status === 'CONFIRMED') &&
            (cancelId === booking.id ? (
              <div className="booking-cancel-confirm">
                <p>
                  Hủy yêu cầu tại {booking.venueName ?? booking.venueSlug}? Yêu cầu sẽ rời hàng chờ của chủ
                  quán.
                </p>
                <div>
                  <button
                    type="button"
                    disabled={cancel.isPending}
                    onClick={() => {
                      setCancelId(null);
                      cancel.reset();
                    }}
                  >
                    Giữ yêu cầu
                  </button>
                  <button
                    type="button"
                    className="booking-cancel-danger"
                    disabled={cancel.isPending}
                    onClick={() => cancel.mutate(booking.id, { onSuccess: () => setCancelId(null) })}
                  >
                    {cancel.isPending ? 'Đang hủy…' : 'Xác nhận hủy'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={cancel.isPending}
                onClick={() => {
                  setCancelId(booking.id);
                  cancel.reset();
                }}
              >
                Hủy yêu cầu
              </button>
            ))}
        </section>
      ))}
      {cancel.isError && <p role="alert">{cancel.error.message}</p>}
    </main>
  );
}
