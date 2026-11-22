import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { AuthLink } from '../../auth/components/AuthLink';
import { useEntitlements } from '../api/subscriptionQueries';
import { useClaimVoucher, useMyVouchers, useVoucherOffers } from '../api/voucherQueries';

export function VouchersPage() {
  const auth = useCurrentUser();
  const entitlements = useEntitlements(Boolean(auth.data));
  const premium = entitlements.data?.entitlements['voucher.exclusive'] === true;
  const offers = useVoucherOffers(premium);
  const mine = useMyVouchers(Boolean(auth.data));
  const claim = useClaimVoucher();
  const [notice, setNotice] = useState('');

  async function take(id: string) {
    setNotice('');
    try {
      await claim.mutateAsync(id);
      setNotice('Đã nhận voucher. Mã nằm trong mục Voucher của tôi bên dưới.');
    } catch {
      /* The mutation error is displayed below. */
    }
  }

  return (
    <main className="plans-page vouchers-page">
      <header className="plans-header">
        <Link to="/" className="brand">
          SeatNow
        </Link>
        <Link to="/">Về bản đồ</Link>
      </header>
      <section className="plans-hero">
        <p className="eyebrow">Dành cho Premium</p>
        <h1>Voucher của bạn</h1>
        <p>Nhận mã ưu đãi dành riêng cho Premium demo và đưa mã cho chủ quán thử xác nhận.</p>
        <p className="small">
          Đây là voucher mô phỏng cho dự án học tập. Không có giá trị thanh toán hoặc sử dụng tại địa điểm
          thật.
        </p>
      </section>
      {auth.isPending || (auth.data && entitlements.isPending) ? <p>Đang kiểm tra gói…</p> : null}
      {!auth.isPending && !auth.data && (
        <p className="notice">
          <AuthLink>Đăng nhập</AuthLink> để xem voucher.
        </p>
      )}
      {auth.data && !entitlements.isPending && !entitlements.isError && !premium && (
        <p className="notice">
          Tài khoản Free có thể xem lại voucher đã nhận. <Link to="/plans">Xem quyền Premium</Link>.
        </p>
      )}
      {entitlements.isError && (
        <p role="alert" className="error">
          Không kiểm tra được gói. <button onClick={() => void entitlements.refetch()}>Thử lại</button>
        </p>
      )}
      {premium && (
        <section aria-label="Voucher đang mở">
          <h2>Đang mở nhận</h2>
          {offers.isPending && <p>Đang tải ưu đãi…</p>}
          {offers.isError && (
            <p role="alert" className="error">
              {offers.error.message} <button onClick={() => void offers.refetch()}>Thử lại</button>
            </p>
          )}
          {offers.data?.length === 0 && (
            <p>Chưa có voucher đang mở nhận. Admin có thể tạo voucher demo trong trang quản trị.</p>
          )}
          <div className="voucher-grid">
            {offers.data?.map((offer) => (
              <article key={offer.id} className="voucher-card">
                <span className="eyebrow">{offer.venueName}</span>
                <h3>{offer.title}</h3>
                <strong>{offer.discountText}</strong>
                <p className="small">
                  Còn {offer.remaining} lượt · Hạn {new Date(offer.expiresAt).toLocaleDateString('vi-VN')}
                </p>
                <button
                  type="button"
                  className="primary"
                  disabled={offer.claimed || claim.isPending}
                  onClick={() => void take(offer.id)}
                >
                  {offer.claimed ? 'Đã nhận' : 'Nhận voucher'}
                </button>
              </article>
            ))}
          </div>
          {claim.isError && (
            <p role="alert" className="error">
              {claim.error.message}
            </p>
          )}
          {notice && (
            <p role="status" className="notice">
              {notice}
            </p>
          )}
        </section>
      )}
      {auth.data && (
        <section aria-label="Voucher của tôi">
          <h2>Voucher của tôi</h2>
          {mine.isPending && <p>Đang tải mã đã nhận…</p>}
          {mine.isError && (
            <p role="alert" className="error">
              {mine.error.message} <button onClick={() => void mine.refetch()}>Thử lại</button>
            </p>
          )}
          {mine.data?.length === 0 && <p>Bạn chưa nhận voucher nào.</p>}
          <div className="voucher-grid">
            {mine.data?.map((item) => (
              <article key={item.id} className="voucher-card">
                <span className="eyebrow">{item.offer.venueName}</span>
                <h3>{item.offer.title}</h3>
                <strong>{item.offer.discountText}</strong>
                <code>{item.code}</code>
                <p className="small">
                  {item.status === 'REDEEMED'
                    ? 'Đã sử dụng'
                    : new Date(item.offer.expiresAt) <= new Date()
                      ? 'Đã hết hạn'
                      : 'Chưa sử dụng'}{' '}
                  · Hạn {new Date(item.offer.expiresAt).toLocaleDateString('vi-VN')}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
