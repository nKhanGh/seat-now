import { FormEvent, useEffect, useState } from 'react';
import { useBookingManagement, useVenueBookings } from '../api/bookingQueries';

export function BookingQueue({
  slug,
  name,
  userId,
  enabled,
}: {
  slug: string;
  name: string;
  userId: string;
  enabled: boolean;
}) {
  const bookings = useVenueBookings(slug, userId);
  const { settings, decision } = useBookingManagement(slug, userId);
  const [draftEnabled, setDraftEnabled] = useState(enabled);
  const [saved, setSaved] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);

  useEffect(() => {
    setDraftEnabled(enabled);
  }, [enabled]);

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draftEnabled === enabled || settings.isPending) return;
    setSaved(false);
    settings.mutate(draftEnabled, { onSuccess: () => setSaved(true) });
  }

  return (
    <section className="card booking-card">
      <h3>Đặt bàn · {name}</h3>
      <p>
        Chỉ yêu cầu được chủ quán xác nhận mới thành đặt bàn. Hãy kiểm tra khả năng phục vụ trước khi xác
        nhận.
      </p>
      <form className="booking-settings" onSubmit={saveSettings}>
        <label>
          <input
            type="checkbox"
            checked={draftEnabled}
            disabled={settings.isPending}
            onChange={(event) => {
              setDraftEnabled(event.target.checked);
              setSaved(false);
              settings.reset();
            }}
          />{' '}
          Nhận yêu cầu đặt bàn
        </label>
        <button type="submit" className="primary" disabled={settings.isPending || draftEnabled === enabled}>
          {settings.isPending ? 'Đang lưu…' : 'Lưu cài đặt'}
        </button>
      </form>
      {saved && <p role="status">Đã lưu cài đặt nhận yêu cầu đặt bàn.</p>}
      {settings.isError && <p role="alert">{settings.error.message}</p>}
      <h4>Yêu cầu cần xử lý</h4>
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
