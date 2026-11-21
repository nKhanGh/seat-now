import { Link } from 'react-router-dom';
import { useBusinessClaims } from '../api/businessQueries';
import { useBusinessContext } from './BusinessPage';

export function BusinessOverviewPage() {
  const { userId, venues } = useBusinessContext();
  const claims = useBusinessClaims(userId);

  return (
    <section className="business-overview" aria-label="Tổng quan quán đang quản lý">
      <div className="business-section-heading">
        <div>
          <h2>Địa điểm đang quản lý</h2>
          <p>Chọn quán và công việc cần làm ở thanh điều hướng phía trên.</p>
        </div>
        <button
          type="button"
          onClick={() => void Promise.all([claims.refetch(), venues.refetch()])}
          disabled={claims.isFetching || venues.isFetching}
        >
          {claims.isFetching || venues.isFetching ? 'Đang cập nhật…' : 'Cập nhật trạng thái'}
        </button>
      </div>
      {venues.isPending && <p>Đang tải địa điểm…</p>}
      {venues.data?.length === 0 && !venues.isFetching && (
        <p>
          {claims.data?.some((claim) => claim.status === 'APPROVED')
            ? 'Yêu cầu đã duyệt nhưng danh sách quản lý chưa hiện. Bấm Cập nhật trạng thái và kiểm tra email đang đăng nhập.'
            : 'Bạn chưa quản lý quán nào. Hãy gửi yêu cầu nhận quyền quản lý một quán đã có trên bản đồ.'}
        </p>
      )}
      <div className="business-venue-grid">
        {venues.data?.map((venue) => (
          <article className="card business-venue-card" key={venue.slug}>
            <p className="eyebrow">
              {venue.category === 'RESTAURANT'
                ? 'Nhà hàng'
                : venue.category === 'CAFE'
                  ? 'Cà phê'
                  : 'Rạp phim'}
            </p>
            <h3>{venue.name}</h3>
            <p>{venue.address}</p>
            <p>
              Gói {venue.plan === 'PREMIUM' ? 'Premium' : 'Cơ bản'}
              {venue.category !== 'CINEMA' &&
                ` · ${venue.bookingEnabled ? 'Đang nhận yêu cầu đặt bàn' : 'Chưa nhận yêu cầu đặt bàn'}`}
            </p>
            <div className="business-venue-actions">
              {venue.category !== 'CINEMA' && (
                <Link to={`/business/venues/${encodeURIComponent(venue.slug)}/bookings`}>Đặt bàn</Link>
              )}
              <Link to={`/business/venues/${encodeURIComponent(venue.slug)}/community`}>Tương tác</Link>
              <Link to={`/business/venues/${encodeURIComponent(venue.slug)}/profile`}>Hồ sơ</Link>
            </div>
          </article>
        ))}
      </div>
      <Link className="business-claim-cta" to="/business/claims">
        Xem yêu cầu quyền và nhận quản lý quán khác
      </Link>
    </section>
  );
}
