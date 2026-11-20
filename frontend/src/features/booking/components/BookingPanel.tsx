import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBookingStatus, useCreateBooking } from '../api/bookingQueries';

function localDateTime(offsetMs: number) {
  const date = new Date(Date.now() + offsetMs);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function BookingPanel({ slug, userId }: { slug: string; userId: string | null }) {
  const status = useBookingStatus(slug);
  const create = useCreateBooking(slug, userId);
  const [requestedAt, setRequestedAt] = useState(() => localDateTime(2 * 60 * 60_000));
  const [guestCount, setGuestCount] = useState(2);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    try {
      await create.mutateAsync({ requestedAt: new Date(requestedAt).toISOString(), guestCount, note });
      setSent(true);
    } catch {
      /* Error is shown below. */
    }
  }

  if (status.isPending) return null;
  if (status.isError)
    return (
      <section className="booking-panel" aria-label="Trạng thái đặt bàn">
        <p role="alert">
          Không tải được trạng thái đặt bàn. <button onClick={() => void status.refetch()}>Thử lại</button>
        </p>
      </section>
    );
  if (!status.data?.enabled) return null;
  return (
    <section className="booking-panel" aria-label="Yêu cầu đặt bàn">
      <h3>Yêu cầu đặt bàn</h3>
      <p className="small">Quán sẽ xác nhận thủ công. Gửi yêu cầu chưa đồng nghĩa đã có bàn.</p>
      {!userId ? (
        <p>
          <Link to="/login">Đăng nhập</Link> để gửi yêu cầu.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)}>
          <label>
            Thời gian đến
            <input
              type="datetime-local"
              value={requestedAt}
              min={localDateTime(60 * 60_000)}
              onChange={(event) => setRequestedAt(event.target.value)}
              required
            />
          </label>
          <label>
            Số khách
            <input
              type="number"
              min="1"
              max="12"
              value={guestCount}
              onChange={(event) => setGuestCount(Number(event.target.value))}
              required
            />
          </label>
          <label>
            Ghi chú (không bắt buộc)
            <textarea value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} />
          </label>
          <button className="primary" disabled={create.isPending}>
            {create.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
          </button>
          {create.isError && <p role="alert">{create.error.message}</p>}
          {sent && (
            <p role="status">
              Đã gửi yêu cầu. <Link to="/bookings">Xem trạng thái</Link>.
            </p>
          )}
        </form>
      )}
    </section>
  );
}
