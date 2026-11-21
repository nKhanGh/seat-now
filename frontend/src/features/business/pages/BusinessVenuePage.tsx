import { Link, useParams } from 'react-router-dom';
import { BookingQueue } from '../../booking/components/BookingQueue';
import { BusinessCommunityPanel } from '../components/BusinessCommunityPanel';
import { AvailabilityEditor, CampaignEditor, Dashboard, ProfileEditor } from '../components/BusinessEditors';
import { useBusinessContext } from './BusinessPage';

const titles: Record<string, string> = {
  bookings: 'Đặt bàn',
  community: 'Tương tác khách hàng',
  profile: 'Hồ sơ và thương hiệu',
  availability: 'Cập nhật chỗ trống',
  dashboard: 'Thống kê',
  offers: 'Ưu đãi',
};

export function BusinessVenuePage() {
  const { slug = '', section = '' } = useParams();
  const { userId, venues } = useBusinessContext();
  const venue = venues.data?.find((item) => item.slug === slug);

  if (venues.isPending) return <p>Đang tải quán…</p>;
  if (venues.isError) return null;
  if (!venue)
    return (
      <p role="alert">
        Tài khoản này chưa được cấp quyền quản lý địa điểm đó.{' '}
        <Link to="/business/claims">Xem yêu cầu quyền</Link>.
      </p>
    );
  if (!titles[section])
    return (
      <p>
        Trang quản lý không tồn tại. <Link to="/business">Về tổng quan</Link>.
      </p>
    );
  if (section === 'bookings' && venue.category === 'CINEMA')
    return <p>Rạp phim chưa hỗ trợ yêu cầu đặt bàn trong bản demo.</p>;
  if (['availability', 'dashboard', 'offers'].includes(section) && venue.plan !== 'PREMIUM')
    return <p>Công cụ này cần gói Premium Business còn hiệu lực.</p>;

  return (
    <section className="business-tool-page" aria-label={`${titles[section]} của ${venue.name}`}>
      <div className="business-tool-heading">
        <p className="eyebrow">{venue.name}</p>
        <h2>{titles[section]}</h2>
      </div>
      {section === 'bookings' && (
        <BookingQueue
          key={venue.slug}
          slug={venue.slug}
          name={venue.name}
          userId={userId}
          enabled={venue.bookingEnabled}
        />
      )}
      {section === 'community' && <BusinessCommunityPanel slug={venue.slug} name={venue.name} />}
      {section === 'profile' && <ProfileEditor key={venue.slug} venue={venue} userId={userId} />}
      {section === 'availability' && <AvailabilityEditor key={venue.slug} venue={venue} />}
      {section === 'dashboard' && <Dashboard venue={venue} userId={userId} />}
      {section === 'offers' && <CampaignEditor key={venue.slug} venue={venue} userId={userId} />}
    </section>
  );
}
