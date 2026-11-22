import { Link, NavLink, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { AuthLink } from '../../auth/components/AuthLink';
import { useBusinessVenues } from '../api/businessQueries';

type BusinessContext = {
  userId: string;
  venues: ReturnType<typeof useBusinessVenues>;
};

export function useBusinessContext() {
  return useOutletContext<BusinessContext>();
}

export function BusinessPage() {
  const auth = useCurrentUser();
  const userId = auth.data?.id ?? null;
  const venues = useBusinessVenues(userId);
  const location = useLocation();
  const navigate = useNavigate();
  const match = location.pathname.match(/^\/business\/venues\/([^/]+)\/([^/]+)$/);
  let routeSlug: string | null = null;
  try {
    routeSlug = match ? decodeURIComponent(match[1]) : null;
  } catch {
    // An invalid URL is handled by the venue page below.
  }
  const preferredSlug = new URLSearchParams(location.search).get('slug');
  const selectedSlug = routeSlug ?? preferredSlug ?? venues.data?.[0]?.slug ?? null;
  const selectedVenue = venues.data?.find((venue) => venue.slug === selectedSlug);
  const section = match?.[2] ?? null;

  function chooseVenue(slug: string) {
    const venue = venues.data?.find((item) => item.slug === slug);
    if (!venue) return;
    const nextSection =
      section &&
      (['profile', 'community', 'vouchers', 'parking'].includes(section) ||
        (section === 'bookings' && venue.category !== 'CINEMA') ||
        (['availability', 'dashboard', 'offers'].includes(section) && venue.plan === 'PREMIUM'))
        ? section
        : venue.category === 'CINEMA'
          ? 'profile'
          : 'bookings';
    void navigate(`/business/venues/${encodeURIComponent(slug)}/${nextSection}`);
  }

  const venuePath = selectedVenue ? `/business/venues/${encodeURIComponent(selectedVenue.slug)}` : null;
  const venueLinks =
    selectedVenue && venuePath
      ? [
          ...(selectedVenue.category === 'CINEMA' ? [] : [{ to: `${venuePath}/bookings`, label: 'Đặt bàn' }]),
          { to: `${venuePath}/community`, label: 'Tương tác' },
          { to: `${venuePath}/profile`, label: 'Hồ sơ' },
          { to: `${venuePath}/vouchers`, label: 'Voucher' },
          { to: `${venuePath}/parking`, label: 'Giữ xe' },
          ...(selectedVenue.plan === 'PREMIUM'
            ? [
                { to: `${venuePath}/availability`, label: 'Chỗ trống' },
                { to: `${venuePath}/dashboard`, label: 'Thống kê' },
                { to: `${venuePath}/offers`, label: 'Ưu đãi' },
              ]
            : []),
        ]
      : [];

  return (
    <main className="plans-page business-page">
      <header className="business-workspace-header">
        <div className="business-workspace-top">
          <Link to="/" className="brand">
            SeatNow
          </Link>
          <Link to="/" className="business-home-link">
            Về trang chính
          </Link>
        </div>
        <div className="business-workspace-title">
          <div>
            <p className="eyebrow">Khu vực chủ quán</p>
            <h1>Quản lý quán</h1>
          </div>
          {selectedVenue && (
            <label>
              Chi nhánh
              <select
                aria-label="Chọn chi nhánh"
                value={selectedVenue.slug}
                onChange={(event) => chooseVenue(event.target.value)}
              >
                {venues.data?.map((venue) => (
                  <option key={venue.slug} value={venue.slug}>
                    {venue.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        <nav className="business-workspace-nav" aria-label="Điều hướng quản lý quán">
          <NavLink to="/business" end>
            Tổng quan
          </NavLink>
          <NavLink to="/business/claims">Yêu cầu quyền</NavLink>
          {venueLinks.map((link) => (
            <NavLink key={link.to} to={link.to}>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      {auth.isPending && <p>Đang kiểm tra đăng nhập…</p>}
      {!auth.isPending && !userId && (
        <p>
          <AuthLink>Đăng nhập</AuthLink> để quản lý quán.
        </p>
      )}
      {userId && (
        <>
          <p className="small business-session">
            Đang đăng nhập: <strong>{auth.data?.email}</strong>. Quyền quản lý gắn với tài khoản này.
          </p>
          {venues.isError && (
            <p role="alert" className="error">
              {venues.error.message} <button onClick={() => void venues.refetch()}>Thử lại</button>
            </p>
          )}
          {!venues.isError && <Outlet context={{ userId, venues } satisfies BusinessContext} />}
        </>
      )}
    </main>
  );
}
