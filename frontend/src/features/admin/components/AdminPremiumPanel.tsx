import { FormEvent, useState } from 'react';
import { useSetDemoPremium } from '../api/adminQueries';

export function AdminPremiumPanel() {
  const [email, setEmail] = useState('');
  const [days, setDays] = useState(7);
  const [notice, setNotice] = useState('');
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const mutation = useSetDemoPremium();

  async function grant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    try {
      const result = await mutation.mutateAsync({ email: email.trim(), days, action: 'grant' });
      setNotice(
        `Đã cấp Premium demo cho ${result.email} đến ${new Date(result.currentPeriodEnd!).toLocaleDateString('vi-VN')}.`,
      );
    } catch {
      /* The error is displayed below. */
    }
  }

  async function revoke() {
    setNotice('');
    try {
      const result = await mutation.mutateAsync({ email: email.trim(), action: 'revoke' });
      setNotice(`Đã thu hồi Premium demo của ${result.email}.`);
      setConfirmRevoke(false);
    } catch {
      /* The error is displayed below. */
    }
  }

  return (
    <section className="admin-premium" aria-label="Quản lý Premium demo">
      <h2>Cấp Premium demo</h2>
      <p className="small">
        Chỉ dùng để thử tính năng trong dự án học tập. Không có thanh toán hoặc gia hạn tự động.
      </p>
      <form onSubmit={(event) => void grant(event)}>
        <label>
          Email người dùng
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </label>
        <label>
          Số ngày hiệu lực (1–30)
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            required
          />
        </label>
        <div className="admin-actions">
          <button className="primary" type="submit" disabled={mutation.isPending}>
            Cấp Premium
          </button>
          <button
            type="button"
            onClick={() => setConfirmRevoke(true)}
            disabled={!email.trim() || mutation.isPending}
          >
            Thu hồi
          </button>
        </div>
      </form>
      {confirmRevoke && (
        <div className="admin-decision" role="group" aria-label="Xác nhận thu hồi Premium">
          <p>Thu hồi Premium demo của {email.trim()}?</p>
          <div className="admin-actions">
            <button type="button" onClick={() => setConfirmRevoke(false)} disabled={mutation.isPending}>
              Giữ nguyên
            </button>
            <button
              type="button"
              className="admin-reject"
              onClick={() => void revoke()}
              disabled={mutation.isPending}
            >
              Xác nhận thu hồi
            </button>
          </div>
        </div>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="error">
          {mutation.error.message}
        </p>
      )}
    </section>
  );
}
