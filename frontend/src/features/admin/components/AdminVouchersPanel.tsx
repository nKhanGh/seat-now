import { FormEvent, useState } from 'react';
import {
  useAdminVouchers,
  useCreateVoucher,
  useDeactivateVoucher,
} from '../../subscription/api/voucherQueries';

export function AdminVouchersPanel() {
  const offers = useAdminVouchers(true);
  const create = useCreateVoucher();
  const deactivate = useDeactivateVoucher();
  const [form, setForm] = useState({ venueSlug: '', title: '', discountText: '', stock: 20, days: 7 });
  const [notice, setNotice] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    try {
      await create.mutateAsync({
        ...form,
        venueSlug: form.venueSlug.trim(),
        title: form.title.trim(),
        discountText: form.discountText.trim(),
      });
      setNotice('Đã tạo voucher demo cho quán.');
      setForm((current) => ({ ...current, title: '', discountText: '' }));
    } catch {
      /* The error is displayed below. */
    }
  }

  return (
    <section className="admin-vouchers" aria-label="Quản lý voucher demo">
      <h2>Tạo voucher Premium demo</h2>
      <p className="small">
        Quán và mã ưu đãi trong dự án là mô phỏng. Chỉ tạo cho quán có chủ quán thử nghiệm.
      </p>
      <form onSubmit={(event) => void submit(event)}>
        <label>
          Slug quán
          <input
            required
            value={form.venueSlug}
            onChange={(event) => setForm((current) => ({ ...current, venueSlug: event.target.value }))}
            placeholder="demo-cafe-nguyen-hue"
          />
        </label>
        <label>
          Tên voucher
          <input
            required
            minLength={5}
            maxLength={100}
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
        </label>
        <label>
          Nội dung ưu đãi
          <input
            required
            minLength={3}
            maxLength={100}
            value={form.discountText}
            onChange={(event) => setForm((current) => ({ ...current, discountText: event.target.value }))}
            placeholder="Giảm 10% (mô phỏng)"
          />
        </label>
        <label>
          Số lượt
          <input
            required
            type="number"
            min={1}
            max={1000}
            value={form.stock}
            onChange={(event) => setForm((current) => ({ ...current, stock: Number(event.target.value) }))}
          />
        </label>
        <label>
          Hiệu lực (ngày)
          <input
            required
            type="number"
            min={1}
            max={30}
            value={form.days}
            onChange={(event) => setForm((current) => ({ ...current, days: Number(event.target.value) }))}
          />
        </label>
        <button className="primary" disabled={create.isPending}>
          {create.isPending ? 'Đang tạo…' : 'Tạo voucher'}
        </button>
      </form>
      {create.isError && (
        <p role="alert" className="error">
          {create.error.message}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      <h3>Voucher đã tạo</h3>
      {offers.isPending && <p>Đang tải…</p>}
      {offers.isError && (
        <p role="alert" className="error">
          {offers.error.message}
        </p>
      )}
      {offers.data?.length === 0 && <p>Chưa có voucher nào.</p>}
      {offers.data?.map((offer) => (
        <article className="admin-voucher-row" key={offer.id}>
          <strong>{offer.title}</strong>
          <span>
            {offer.venueName} · {offer.discountText}
          </span>
          <span>
            Còn {offer.remaining} lượt · {offer.status === 'ACTIVE' ? 'Đang mở' : 'Đã tắt'} · Hạn{' '}
            {new Date(offer.expiresAt).toLocaleDateString('vi-VN')}
          </span>
          {offer.status === 'ACTIVE' && (
            <button type="button" disabled={deactivate.isPending} onClick={() => deactivate.mutate(offer.id)}>
              Tắt voucher
            </button>
          )}
        </article>
      ))}
      {deactivate.isError && (
        <p role="alert" className="error">
          {deactivate.error.message}
        </p>
      )}
    </section>
  );
}
