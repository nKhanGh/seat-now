import { useBookingManagement, useVenueBookings } from '../api/bookingQueries';

export function BookingQueue({ slug, userId, enabled }: { slug: string; userId: string; enabled: boolean }) {
  const bookings = useVenueBookings(slug, userId);
  const { settings, decision } = useBookingManagement(slug, userId);
  return (
    <section className="card booking-card">
      <h3>Hàng chờ đặt bàn · {slug}</h3>
      <p>
        Chỉ yêu cầu được chủ quán xác nhận mới thành đặt bàn. Hãy kiểm tra khả năng phục vụ trước khi xác
        nhận.
      </p>
      <label>
        <input
          type="checkbox"
          checked={enabled}
          disabled={settings.isPending}
          onChange={(event) => settings.mutate(event.target.checked)}
        />{' '}
        Nhận yêu cầu đặt bàn
      </label>
      {settings.isError && <p role="alert">{settings.error.message}</p>}
      {bookings.isPending && <p>Đang tải yêu cầu…</p>}
      {bookings.isError && <p role="alert">{bookings.error.message}</p>}
      {bookings.data?.length === 0 && <p>Không có yêu cầu đang chờ.</p>}
      {bookings.data?.map((booking) => (
        <div className="booking-row" key={booking.id}>
          <strong>{new Date(booking.requestedAt).toLocaleString('vi-VN')}</strong>
          <span>
            {booking.guestCount} khách · {booking.priority ? 'Ưu tiên Premium' : 'Thường'} · {booking.status}
          </span>
          {booking.note && <span>Ghi chú: {booking.note}</span>}
          {booking.status === 'PENDING' && (
            <div>
              <button
                disabled={decision.isPending}
                onClick={() => decision.mutate({ id: booking.id, status: 'CONFIRMED' })}
              >
                Xác nhận
              </button>{' '}
              <button
                disabled={decision.isPending}
                onClick={() => decision.mutate({ id: booking.id, status: 'DECLINED' })}
              >
                Từ chối
              </button>
            </div>
          )}
        </div>
      ))}
      {decision.isError && <p role="alert">{decision.error.message}</p>}
    </section>
  );
}
