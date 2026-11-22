import { FormEvent, useState } from 'react';
import { voucherService } from '../../subscription/services/voucher.service';

export function VoucherRedeemPanel({ slug }: { slug: string }) {
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage('');
    setError('');
    try {
      const result = await voucherService.redeem(slug, code.trim().toUpperCase());
      setMessage(`Đã xác nhận mã ${result.code}: ${result.discountText}.`);
      setCode('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không xác nhận được voucher.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="card business-form" onSubmit={(event) => void redeem(event)}>
      <h3>Xác nhận mã voucher</h3>
      <p>Nhập mã do khách đưa. Mỗi mã chỉ dùng một lần và chỉ hợp lệ tại quán này.</p>
      <label>
        Mã voucher
        <input
          required
          pattern="SN-[A-Fa-f0-9]{12}"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="SN-XXXXXXXXXXXX"
        />
      </label>
      <button className="primary" disabled={pending}>
        {pending ? 'Đang xác nhận…' : 'Xác nhận sử dụng'}
      </button>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
    </form>
  );
}
