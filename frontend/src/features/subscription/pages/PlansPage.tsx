import { Link } from 'react-router-dom';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useEntitlements, useSubscription } from '../api/subscriptionQueries';

const features = [
  { name: 'Bản đồ, bộ lọc và tình trạng chỗ ngồi', free: true, premium: true, available: true },
  { name: 'Thông tin bãi đỗ xe gần địa điểm', free: true, premium: true, available: true },
  { name: 'Check-in, review và lưu địa điểm', free: true, premium: true, available: true },
  { name: 'Gửi yêu cầu đặt bàn tại quán đối tác', free: true, premium: true, available: true },
  { name: 'Ưu tiên xử lý yêu cầu đặt bàn', free: false, premium: true, available: true },
  { name: 'Không quảng cáo trên bản đồ', free: false, premium: true, available: true },
  {
    name: 'Yêu cầu giữ chỗ xe tại bãi của quán (chủ quán xác nhận)',
    free: false,
    premium: true,
    available: true,
  },
  { name: 'Voucher demo có mã dùng một lần', free: false, premium: true, available: true },
  {
    name: 'Gợi ý cá nhân hóa theo khẩu vị, ngân sách và lịch sử',
    free: false,
    premium: true,
    available: true,
  },
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
          Bản đồ, cộng đồng và yêu cầu đặt bàn tại quán đối tác dùng miễn phí. Premium demo được ưu tiên trong
          hàng chờ, xem bản đồ không quảng cáo và nhận gợi ý theo sở thích. Chưa mở thanh toán; admin có thể
          cấp Premium demo.
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
          Bạn có thể dùng các tính năng Free ngay. <AuthLink>Đăng nhập</AuthLink> để xem gói của mình.
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
          <p>Ưu tiên yêu cầu đặt bàn và ẩn quảng cáo trên bản đồ trong bản demo.</p>
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
          <Link to="/recommendations">Thử gợi ý cá nhân hóa</Link>
          <p>
            <Link to="/vouchers">Xem voucher Premium</Link>
          </p>
          <p>
            <Link to="/parking-reservations">Xem yêu cầu giữ xe</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
