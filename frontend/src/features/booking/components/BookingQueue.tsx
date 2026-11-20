import { useState } from 'react';
import { useBookingManagement, useVenueBookings } from '../api/bookingQueries';

export function BookingQueue({ slug, userId, enabled }: { slug: string; userId: string; enabled: boolean }) {
  const bookings = useVenueBookings(slug, userId);
  const { settings, decision } = useBookingManagement(slug, userId);
  const [completingId, setCompletingId] = useState<string | null>(null);
  return (
    <section className="card booking-card">
      <h3>Yêu cầu và bàn đã xác nhận · {slug}</h3>
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
      {bookings.data?.length === 0 && <p>Không có yêu cầu hoặc bàn đã xác nhận cần xử lý.</p>}
      {bookings.data?.map((booking) => (
        <div className="booking-row" key={booking.id}>
          <strong>{new Date(booking.requestedAt).toLocaleString('vi-VN')}</strong>
          {booking.guestDisplayName && <span>Người gửi: {booking.guestDisplayName}</span>}
          <span>
            {booking.guestCount} khách · {booking.priority ? 'Ưu tiên Premium' : 'Thường'} ·{' '}
            {booking.status === 'PENDING' ? 'Chờ xác nhận' : 'Đã xác nhận'}
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
          {booking.status === 'CONFIRMED' &&
            (completingId === booking.id ? (
              <div className="booking-cancel-confirm">
                <p>Đã đón {booking.guestCount} khách của yêu cầu này?</p>
                <div>
                  <button type="button" disabled={decision.isPending} onClick={() => setCompletingId(null)}>
                    Chưa đón khách
                  </button>
                  <button
                    type="button"
                    disabled={decision.isPending}
                    onClick={() =>
                      decision.mutate(
                        { id: booking.id, status: 'COMPLETED' },
                        { onSuccess: () => setCompletingId(null) },
                      )
                    }
                  >
                    Xác nhận đã đón
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" disabled={decision.isPending} onClick={() => setCompletingId(booking.id)}>
                Đánh dấu đã đón khách
              </button>
            ))}
        </div>
      ))}
      {decision.isError && <p role="alert">{decision.error.message}</p>}
    </section>
  );
}
