import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useEntitlements, useSubscription } from '../api/subscriptionQueries';

const features = [
  { name: 'Bản đồ, bộ lọc và tình trạng chỗ ngồi', free: true, premium: true, available: true },
  { name: 'Thông tin bãi đỗ xe gần địa điểm', free: true, premium: true, available: true },
  { name: 'Check-in, review và lưu địa điểm', free: true, premium: true, available: false },
  { name: 'Không quảng cáo', free: false, premium: true, available: false },
  { name: 'Đặt bàn ưu tiên và giữ chỗ xe', free: false, premium: true, available: false },
  { name: 'Voucher độc quyền và gợi ý AI nâng cao', free: false, premium: true, available: false },
] as const;

export function PlansPage() {
  const auth = useCurrentUser();
  const enabled = Boolean(auth.data);
  const subscription = useSubscription(enabled);
  const entitlements = useEntitlements(enabled);
  return (
    <main className="plans-page">
      <header className="plans-header">
        <Link to="/" className="brand">
          SeatNow
        </Link>
        <Link to="/">Về bản đồ</Link>
      </header>
      <section className="plans-hero">
        <p className="eyebrow">Gói dành cho người dùng</p>
        <h1>Chọn cách khám phá phù hợp</h1>
        <p>
          Ba tính năng chính hiện dùng miễn phí. Các quyền Premium đang được phát triển, chưa mở thanh toán.
        </p>
      </section>
      {enabled ? (
        <section className="plan-current" aria-label="Gói hiện tại">
          {subscription.isPending && <p>Đang tải gói của bạn…</p>}
          {subscription.isError && (
            <p role="alert">
              Không tải được gói hiện tại.{' '}
              <button onClick={() => void subscription.refetch()}>Thử lại</button>
            </p>
          )}
          {subscription.data && (
            <p>
              Gói hiện tại: <strong>{subscription.data.plan}</strong>
              {subscription.data.plan === 'PREMIUM' &&
                subscription.data.currentPeriodEnd &&
                ` · Hiệu lực đến ${new Date(subscription.data.currentPeriodEnd).toLocaleDateString('vi-VN')}`}
            </p>
          )}
          {entitlements.data && (
            <p className="small">
              Bản đồ, tình trạng chỗ ngồi và bãi xe:{' '}
              {entitlements.data.entitlements['map.basic'] &&
              entitlements.data.entitlements['availability.read'] &&
              entitlements.data.entitlements['parking.read']
                ? 'đang sử dụng được'
                : 'chưa khả dụng'}
              .
            </p>
          )}
        </section>
      ) : (
        <p className="plan-current">
          Bạn có thể dùng các tính năng Free ngay. <Link to="/login">Đăng nhập</Link> để xem gói của mình.
        </p>
      )}
      <div className="plan-grid">
        <section className="plan-card">
          <h2>Free</h2>
          <p>Khám phá địa điểm, chỗ ngồi và bãi xe.</p>
          <strong>Miễn phí</strong>
          <ul>
            {features
              .filter((feature) => feature.free)
              .map((feature) => (
                <li key={feature.name}>
                  {feature.name}
                  {!feature.available && <span className="coming-soon">Sắp ra mắt</span>}
                </li>
              ))}
          </ul>
        </section>
        <section className="plan-card">
          <h2>Premium</h2>
          <p>Thêm quyền ưu tiên và cá nhân hóa khi các tính năng ra mắt.</p>
          <strong>Chưa mở bán</strong>
          <ul>
            {features
              .filter((feature) => feature.premium)
              .map((feature) => (
                <li key={feature.name}>
                  {feature.name}
                  {!feature.available && <span className="coming-soon">Sắp ra mắt</span>}
                </li>
              ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
