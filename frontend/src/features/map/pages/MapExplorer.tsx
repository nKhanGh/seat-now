import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Menu, PanelLeft, Search, SlidersHorizontal, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../auth/api/authQueries';
import { AuthLink } from '../../auth/components/AuthLink';
import { useHcmVenuePins, useNearbyVenues, usePublishedVenueSearch, useVenueDetail } from '../api/mapQueries';
import { VenueMap } from '../components/VenueMap';
import { AvailabilityStatus } from '../components/AvailabilityStatus';
import { AvailabilityHistory } from '../components/AvailabilityHistory';
import { FilterSelect } from '../components/FilterSelect';
import { MapFilters, VenueMapItem } from '../services/map.service';
import { useParkingForVenue } from '../../parking/api/parkingQueries';
import { ParkingList } from '../../parking/components/ParkingList';
import { ParkingFilters } from '../../parking/components/ParkingFilters';
import { ParkingFilters as ParkingFilterValues } from '../../parking/services/parking.service';
import { useLiveUpdates } from '../../live/useLiveUpdates';
import { CheckInPanel } from '../../community/components/CheckInPanel';
import { FavoriteButton } from '../../community/components/FavoriteButton';
import { useFavorites } from '../../community/api/favoritesQueries';
import { ReviewPanel } from '../../community/components/ReviewPanel';
import { ShareVenueButton } from '../../community/components/ShareVenueButton';
import { BookingPanel } from '../../booking/components/BookingPanel';
import { NearbySuggestions } from '../components/NearbySuggestions';
import { nearbySuggestions } from '../services/nearbySuggestions';
import { searchVenues } from '../services/venueSearch';
import { directionsUrl } from '../services/directions';
import { distanceMeters, venuesWithinRadius } from '../services/geo';
import { sortVenues, VenueSort } from '../services/sortVenues';
import { ratingLabel } from '../services/ratingLabel';
import { useEntitlements } from '../../subscription/api/subscriptionQueries';
import { PRICE_TIER_OPTIONS, priceTierLabel } from '../../../shared/priceTier';

const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;
const readNumber = (value: string | null, fallback: number) =>
  value !== null && Number.isFinite(Number(value)) ? Number(value) : fallback;
const cuisineLabels = {
  VIETNAMESE: 'Món Việt',
  WESTERN: 'Món Âu',
  COFFEE: 'Cà phê',
  DESSERT: 'Tráng miệng',
} as const;

export function MapExplorer() {
  const [params, setParams] = useSearchParams();
  const [filtersVisible, setFiltersVisible] = useState(
    () => !window.matchMedia('(max-width: 760px)').matches,
  );
  const [sidebarVisible, setSidebarVisible] = useState(
    () => !window.matchMedia('(max-width: 760px)').matches,
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectionSerial, setSelectionSerial] = useState(0);
  const [selectedParkingSlug, setSelectedParkingSlug] = useState<string | null>(null);
  const [parkingFilters, setParkingFilters] = useState<ParkingFilterValues>({
    vehicleType: '',
    hasAvailability: false,
    open24h: false,
    freeOnly: false,
  });
  const [locationMessage, setLocationMessage] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracyM: number } | null>(
    null,
  );
  const [seenVenues, setSeenVenues] = useState<VenueMapItem[]>([]);
  const detailRef = useRef<HTMLElement | null>(null);
  const logoutDialog = useRef<HTMLDialogElement | null>(null);
  const auth = useCurrentUser();
  const entitlements = useEntitlements(Boolean(auth.data));
  const adsHidden = entitlements.data?.entitlements['ads.hidden'] ?? false;
  const mapReady = !auth.isPending;
  const favorites = useFavorites(auth.data?.id ?? null);
  const logout = useLogout();
  useEffect(() => {
    const narrowScreen = window.matchMedia('(max-width: 760px)');
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      setFiltersVisible(!event.matches);
      setSidebarVisible(!event.matches);
      setMobileMenuOpen(false);
    };
    narrowScreen.addEventListener('change', onBreakpointChange);
    return () => narrowScreen.removeEventListener('change', onBreakpointChange);
  }, []);
  const filters = useMemo<MapFilters>(
    () => ({
      lat: readNumber(params.get('lat'), DEFAULT_LAT),
      lng: readNumber(params.get('lng'), DEFAULT_LNG),
      radiusM: readNumber(params.get('radiusM'), 3000),
      category: params.get('category') || undefined,
      cuisine: params.get('cuisine') || undefined,
      priceTier: Number(params.get('priceTier')) || undefined,
      ratingGte: Number(params.get('ratingGte')) || undefined,
      crowdLevel: params.get('crowdLevel') || undefined,
      hasAvailability: params.get('hasAvailability') === 'true',
      adsHidden,
    }),
    [params, adsHidden],
  );
  const venues = useNearbyVenues(filters, mapReady);
  const catalog = useHcmVenuePins(filters, mapReady);
  const venueItems = useMemo(() => venues.data?.pages.flatMap((page) => page.data) ?? [], [venues.data]);
  const venuesInRadius = useMemo(
    () => venuesWithinRadius(seenVenues, [filters.lng, filters.lat], filters.radiusM),
    [seenVenues, filters.lng, filters.lat, filters.radiusM],
  );
  const filterSignature = JSON.stringify([
    filters.category,
    filters.cuisine,
    filters.priceTier,
    filters.ratingGte,
    filters.crowdLevel,
    filters.hasAvailability,
    filters.adsHidden,
  ]);
  const lastFilterSignature = useRef(filterSignature);
  useEffect(() => {
    const changed = lastFilterSignature.current !== filterSignature;
    lastFilterSignature.current = filterSignature;
    setSeenVenues((current) => {
      const bySlug = new Map((changed ? [] : current).map((venue) => [venue.slug, venue]));
      for (const venue of [...(catalog.data ?? []), ...venueItems]) bySlug.set(venue.slug, venue);
      return [...bySlug.values()].slice(-500);
    });
  }, [catalog.data, venueItems, filterSignature]);
  const searchText = params.get('q') ?? '';
  const searching = Boolean(searchText.trim());
  const requestedSort = params.get('sort');
  const sortOrder: VenueSort =
    requestedSort === 'rating' || requestedSort === 'price' ? requestedSort : 'distance';
  const savedRequested = params.get('saved') === 'true';
  const savedOnly = savedRequested && Boolean(auth.data);
  const favoriteSlugs = useMemo(
    () => new Set(favorites.data?.map((venue) => venue.slug) ?? []),
    [favorites.data],
  );
  const hasActiveFilters =
    searching ||
    savedRequested ||
    sortOrder !== 'distance' ||
    filters.radiusM !== 3000 ||
    Boolean(
      filters.category ||
      filters.cuisine ||
      filters.priceTier ||
      filters.ratingGte ||
      filters.crowdLevel ||
      filters.hasAvailability,
    );
  const { query: publishedSearch, activeQuery } = usePublishedVenueSearch(searchText);
  const remoteReady = searching && activeQuery === searchText.trim();
  const displayedVenues = useMemo(() => {
    const nearbyItems = venues.isError && venueItems.length === 0 ? venuesInRadius : venueItems;
    const candidates = searching
      ? searchVenues(venuesInRadius, searchText)
      : savedOnly
        ? venuesInRadius
        : nearbyItems;
    const filtered = savedOnly ? candidates.filter((venue) => favoriteSlugs.has(venue.slug)) : candidates;
    return searching ? filtered : sortVenues(filtered, sortOrder, [filters.lng, filters.lat]);
  }, [
    searching,
    searchText,
    savedOnly,
    venuesInRadius,
    venueItems,
    venues.isError,
    favoriteSlugs,
    sortOrder,
    filters.lng,
    filters.lat,
    filters.radiusM,
  ]);
  const mapVenues = useMemo(
    () =>
      savedOnly
        ? venuesInRadius.filter(
            (venue) => favoriteSlugs.has(venue.slug) || venue.slug === params.get('venue'),
          )
        : venuesInRadius,
    [savedOnly, venuesInRadius, favoriteSlugs, params],
  );
  const publishedOnly = useMemo(() => {
    if (!remoteReady) return [];
    const knownSlugs = new Set(displayedVenues.map((venue) => venue.slug));
    return (
      publishedSearch.data?.data.filter(
        (venue) =>
          !knownSlugs.has(venue.slug) &&
          (!savedOnly || favoriteSlugs.has(venue.slug)) &&
          distanceMeters([filters.lng, filters.lat], venue.location.coordinates) <= filters.radiusM,
      ) ?? []
    );
  }, [
    displayedVenues,
    publishedSearch.data,
    remoteReady,
    savedOnly,
    favoriteSlugs,
    filters.lng,
    filters.lat,
    filters.radiusM,
  ]);
  const selected = seenVenues.find((item) => item.slug === params.get('venue'));
  const selectedId = selected?.id ?? null;
  useEffect(() => {
    if (!selectedId || !window.matchMedia('(max-width: 760px)').matches) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const frame = requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior }));
    return () => cancelAnimationFrame(frame);
  }, [selectedId, selectionSerial]);
  const userCoordinates: [number, number] | undefined = userLocation
    ? [userLocation.lng, userLocation.lat]
    : undefined;
  const selectedDirections = selected ? directionsUrl(selected.location.coordinates, userCoordinates) : null;
  const suggestions = useMemo(
    () => (selected ? nearbySuggestions(selected, seenVenues) : []),
    [selected, seenVenues],
  );
  const venueDetail = useVenueDetail(selected?.slug ?? null);
  const parking = useParkingForVenue(selected?.slug ?? null, parkingFilters);
  const parkingItems = useMemo(() => parking.data?.pages.flatMap((page) => page.data) ?? [], [parking.data]);
  const updateParkingFilters = useCallback((next: ParkingFilterValues) => {
    setParkingFilters(next);
    setSelectedParkingSlug(null);
  }, []);
  const liveStatus = useLiveUpdates(
    venueItems.map((item) => item.slug),
    parkingItems.map((item) => item.slug),
  );
  const selectVenue = useCallback(
    (id: string) => {
      setSelectedParkingSlug(null);
      setSelectionSerial((current) => current + 1);
      const slug = seenVenues.find((item) => item.id === id)?.slug;
      if (slug)
        setParams(
          (current) => {
            const next = new URLSearchParams(current);
            next.set('venue', slug);
            return next;
          },
          { replace: true },
        );
    },
    [seenVenues, setParams],
  );
  const update = useCallback(
    (patch: Record<string, string | null>) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(patch)) {
            if (value) next.set(key, value);
            else next.delete(key);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );
  const selectPublishedVenue = useCallback(
    (venue: { slug: string; location: { coordinates: [number, number] } }) => {
      setSelectedParkingSlug(null);
      setSelectionSerial((current) => current + 1);
      update({
        venue: venue.slug,
        lat: String(venue.location.coordinates[1]),
        lng: String(venue.location.coordinates[0]),
        category: null,
        cuisine: null,
        priceTier: null,
        ratingGte: null,
        crowdLevel: null,
        hasAvailability: null,
      });
    },
    [update],
  );
  const onCenterChange = useCallback(
    (lat: number, lng: number) => {
      if (Math.abs(lat - filters.lat) < 0.00001 && Math.abs(lng - filters.lng) < 0.00001) return;
      update({ lat: String(lat), lng: String(lng) });
    },
    [update, filters.lat, filters.lng],
  );

  function locate() {
    if (!navigator.geolocation) {
      setLocationMessage('Trình duyệt không hỗ trợ vị trí.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ lat: coords.latitude, lng: coords.longitude, accuracyM: coords.accuracy });
        update({
          lat: String(Number(coords.latitude.toFixed(5))),
          lng: String(Number(coords.longitude.toFixed(5))),
        });
        setLocationMessage(
          `Đã đánh dấu vị trí của bạn (độ chính xác khoảng ${Math.round(coords.accuracy)} m).`,
        );
      },
      (error) =>
        setLocationMessage(
          error.code === error.PERMISSION_DENIED
            ? 'Bạn chưa cấp quyền vị trí. Hãy cho phép vị trí cho trang này rồi thử lại.'
            : error.code === error.TIMEOUT
              ? 'Hết thời gian lấy vị trí. Hãy thử lại khi thiết bị có tín hiệu tốt hơn.'
              : 'Không lấy được vị trí. Hãy mở trang bằng localhost hoặc HTTPS và thử lại.',
        ),
      { timeout: 8000 },
    );
  }

  return (
    <main className="explorer">
      <header className="explorer-header">
        <div className="header-primary">
          <Link to="/" className="brand">
            SeatNow
          </Link>
          <Link to="/business" className="header-business-link">
            Quản lý quán
          </Link>
          <button
            type="button"
            className="mobile-menu-toggle"
            aria-controls="explorer-navigation"
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>
        <nav
          id="explorer-navigation"
          className={mobileMenuOpen ? 'mobile-open' : ''}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) setMobileMenuOpen(false);
          }}
        >
          <span className="sync-status" role="status">
            {liveStatus === 'connected'
              ? 'Cập nhật trực tiếp'
              : liveStatus === 'offline'
                ? 'Đồng bộ định kỳ'
                : 'Đang kết nối'}
          </span>
          <Link to="/business" className="mobile-business-link">
            Quản lý quán
          </Link>
          <Link to="/plans">Gói người dùng</Link>
          {entitlements.data?.plan === 'PREMIUM' && (
            <Link to="/plans" className="header-premium-link">
              ✦ Premium của tôi
            </Link>
          )}
          <Link to={`/recommendations?lat=${filters.lat}&lng=${filters.lng}`}>Dành cho bạn</Link>
          <Link to="/vouchers">Voucher</Link>
          <Link to="/parking-reservations">Chỗ xe của tôi</Link>
          <Link to={`/proposals?lat=${filters.lat}&lng=${filters.lng}`}>Đề xuất quán</Link>
          {auth.data ? (
            <>
              <Link to="/favorites">Quán đã lưu</Link>
              <Link to="/bookings">Đặt bàn của tôi</Link>
              <Link to="/following">Đang theo dõi</Link>
              {auth.data.role === 'ADMIN' && <Link to="/admin">Xét duyệt</Link>}
              <span>Chào {auth.data.displayName}</span>
              <button
                onClick={() => {
                  logout.reset();
                  logoutDialog.current?.showModal();
                }}
                disabled={logout.isPending}
              >
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <AuthLink>Đăng nhập</AuthLink>
              <AuthLink mode="register">Đăng ký</AuthLink>
            </>
          )}
        </nav>
      </header>
      <dialog ref={logoutDialog} className="logout-dialog" aria-labelledby="logout-title">
        <h2 id="logout-title">Đăng xuất khỏi SeatNow?</h2>
        <p>Bạn có thể đăng nhập lại bất cứ lúc nào.</p>
        {logout.isError && (
          <p role="alert" className="error">
            {logout.error.message}
          </p>
        )}
        <div className="logout-actions">
          <button type="button" onClick={() => logoutDialog.current?.close()} disabled={logout.isPending}>
            Ở lại
          </button>
          <button
            type="button"
            className="primary"
            onClick={() => logout.mutate(undefined, { onSuccess: () => logoutDialog.current?.close() })}
            disabled={logout.isPending}
          >
            {logout.isPending ? 'Đang đăng xuất…' : 'Xác nhận đăng xuất'}
          </button>
        </div>
      </dialog>
      <div className="explorer-controls" aria-label="Điều khiển bố cục bản đồ">
        <button
          type="button"
          aria-controls="venue-sidebar"
          aria-expanded={sidebarVisible}
          onClick={() => setSidebarVisible((visible) => !visible)}
        >
          <PanelLeft size={18} aria-hidden="true" />
          {sidebarVisible ? 'Thu gọn danh sách' : 'Hiện danh sách'}
        </button>
        <button
          type="button"
          aria-controls="map-filters"
          aria-expanded={filtersVisible}
          onClick={() => setFiltersVisible((visible) => !visible)}
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          {filtersVisible ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
        </button>
      </div>
      <section id="map-filters" className="filterbar" aria-label="Bộ lọc địa điểm" hidden={!filtersVisible}>
        <label className="venue-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            aria-label="Tìm địa điểm theo tên hoặc địa chỉ"
            placeholder="Tìm tên quán, địa chỉ…"
            value={searchText}
            onChange={(event) => update({ q: event.target.value || null })}
          />
        </label>
        <FilterSelect
          label="Loại địa điểm"
          value={filters.category || ''}
          onChange={(category) => update({ category })}
          options={[
            { value: '', label: 'Tất cả loại' },
            { value: 'RESTAURANT', label: 'Nhà hàng' },
            { value: 'CAFE', label: 'Cà phê' },
            { value: 'CINEMA', label: 'Rạp phim' },
          ]}
        />
        <FilterSelect
          label="Loại món"
          value={filters.cuisine || ''}
          onChange={(cuisine) => update({ cuisine })}
          options={[
            { value: '', label: 'Tất cả món' },
            { value: 'VIETNAMESE', label: 'Món Việt' },
            { value: 'WESTERN', label: 'Món Âu' },
            { value: 'COFFEE', label: 'Cà phê' },
            { value: 'DESSERT', label: 'Tráng miệng' },
          ]}
        />
        <FilterSelect
          label="Bán kính"
          value={String(filters.radiusM)}
          onChange={(radiusM) => update({ radiusM, venue: null })}
          options={[
            { value: '1000', label: '1 km' },
            { value: '3000', label: '3 km' },
            { value: '5000', label: '5 km' },
            { value: '10000', label: '10 km' },
          ]}
        />
        <FilterSelect
          className="price-filter"
          label="Mức giá"
          value={String(filters.priceTier || '')}
          onChange={(priceTier) => update({ priceTier })}
          options={[
            { value: '', label: 'Mọi mức giá' },
            ...PRICE_TIER_OPTIONS.map((option) => ({ ...option, value: String(option.value) })),
          ]}
        />
        <FilterSelect
          label="Đánh giá tối thiểu"
          value={String(filters.ratingGte || '')}
          onChange={(ratingGte) => update({ ratingGte })}
          options={[
            { value: '', label: 'Mọi đánh giá' },
            { value: '4', label: 'Từ 4 sao' },
            { value: '4.5', label: 'Từ 4.5 sao' },
          ]}
        />
        <FilterSelect
          label="Độ đông"
          value={filters.crowdLevel || ''}
          onChange={(crowdLevel) => update({ crowdLevel })}
          align="end"
          options={[
            { value: '', label: 'Mọi độ đông' },
            { value: 'QUIET', label: 'Vắng' },
            { value: 'MODERATE', label: 'Vừa' },
            { value: 'BUSY', label: 'Đông' },
            { value: 'FULL', label: 'Đầy' },
          ]}
        />
        <FilterSelect
          label="Sắp xếp danh sách"
          value={sortOrder}
          onChange={(sort) => update({ sort: sort === 'distance' ? null : sort })}
          disabled={searching}
          align="end"
          options={[
            { value: 'distance', label: 'Gần nhất' },
            { value: 'rating', label: 'Đánh giá cao' },
            { value: 'price', label: 'Giá thấp' },
          ]}
        />
        <label className="filter-check">
          <input
            type="checkbox"
            checked={filters.hasAvailability}
            onChange={(event) => update({ hasAvailability: event.target.checked ? 'true' : null })}
          />{' '}
          Còn bàn
        </label>
        {auth.data && (
          <label className="filter-check">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(event) => update({ saved: event.target.checked ? 'true' : null })}
            />{' '}
            Chỉ quán đã lưu
          </label>
        )}
        {adsHidden && <span className="small">Premium · bản đồ không quảng cáo</span>}
        <button onClick={locate}>Vị trí của tôi</button>
        {hasActiveFilters && (
          <button
            type="button"
            className="filter-reset"
            onClick={() =>
              update({
                q: null,
                category: null,
                cuisine: null,
                radiusM: null,
                priceTier: null,
                ratingGte: null,
                crowdLevel: null,
                hasAvailability: null,
                saved: null,
                sort: null,
              })
            }
          >
            Xóa bộ lọc
          </button>
        )}
      </section>
      {locationMessage && (
        <p role="status" className="location-message">
          {locationMessage}
        </p>
      )}
      <div className={`explorer-body${sidebarVisible ? '' : ' sidebar-collapsed'}`}>
        <section
          id="venue-sidebar"
          className="venue-list"
          aria-label="Danh sách địa điểm"
          hidden={!sidebarVisible}
        >
          <h1>Khám phá quanh bạn</h1>
          <p className="small">
            Dữ liệu mẫu hư cấu tại nhiều khu vực TP.HCM. Tình trạng chỗ ngồi chưa kết nối nguồn trực tiếp.
          </p>
          {searching && (
            <p className="small">Tìm trong các địa điểm đã tải · {displayedVenues.length} kết quả.</p>
          )}
          {!searching && sortOrder !== 'distance' && (
            <p className="small">Sắp xếp các địa điểm đã tải; bấm Xem thêm để bổ sung kết quả.</p>
          )}
          {savedOnly && favorites.isPending && <p>Đang tải quán đã lưu…</p>}
          {savedOnly && favorites.isError && (
            <p role="alert">
              {favorites.error.message} <button onClick={() => void favorites.refetch()}>Thử lại</button>
            </p>
          )}
          {savedOnly && favorites.data && displayedVenues.length === 0 && (
            <p>
              Chưa có quán đã lưu phù hợp trong dữ liệu đang xem.{' '}
              <Link to="/favorites">Xem tất cả quán đã lưu</Link>.
            </p>
          )}
          {searching && catalog.isPending && seenVenues.length === 0 && <p>Đang tải dữ liệu để tìm…</p>}
          {searching && catalog.isError && seenVenues.length === 0 && (
            <p role="alert">
              Không tải được danh sách để tìm. <button onClick={() => void catalog.refetch()}>Thử lại</button>
            </p>
          )}
          {!searching && venues.isPending && <p>Đang tìm địa điểm…</p>}
          {!searching && venues.isError && displayedVenues.length === 0 && (
            <p role="alert">
              {venues.error.message} <button onClick={() => void venues.refetch()}>Thử lại</button>
            </p>
          )}
          {!searching && !savedOnly && !venues.isError && venues.data?.pages[0]?.data.length === 0 && (
            <p>Không có địa điểm trong khu vực hoặc bộ lọc này.</p>
          )}
          {searching && !savedOnly && !catalog.isPending && displayedVenues.length === 0 && (
            <p>Không tìm thấy địa điểm đã tải. Hãy thử tên khác hoặc bỏ bớt bộ lọc.</p>
          )}
          {displayedVenues.map((venue) => (
            <button
              key={venue.id}
              className={`venue-card${selectedId === venue.id ? ' selected' : ''}`}
              onClick={() => selectVenue(venue.id)}
            >
              <span className="venue-category">
                {venue.promotion?.sponsored && <span className="sponsored-label">Được tài trợ · </span>}
                {venue.category === 'CAFE' ? 'Cà phê' : venue.category === 'CINEMA' ? 'Rạp phim' : 'Nhà hàng'}
              </span>
              <strong>
                {venue.logoUrl && <img className="venue-list-logo" src={venue.logoUrl} alt="" />}
                {venue.name}{' '}
                {venue.verified && (
                  <span className="verified-badge" aria-label="Chủ quán đã xác thực">
                    ✓
                  </span>
                )}
              </strong>
              <span>{venue.address}</span>
              <span>
                {ratingLabel(venue.rating)} ·{' '}
                {searching
                  ? 'Xem trên bản đồ'
                  : `${distanceMeters([filters.lng, filters.lat], venue.location.coordinates)} m`}{' '}
                · Giá: {priceTierLabel(venue.priceTier)}
              </span>
              {venue.promotion && <span className="promotion-label">{venue.promotion.text}</span>}
              {venue.verified &&
                venue.availability.freshness === 'FRESH' &&
                venue.availability.acceptingGuests &&
                venue.availability.crowdLevel === 'QUIET' &&
                venue.availability.tablesTotal !== null &&
                venue.availability.tablesTotal > 0 &&
                venue.availability.tablesAvailable !== null &&
                venue.availability.tablesAvailable / venue.availability.tablesTotal >= 0.5 && (
                  <span className="promotion-label">Còn nhiều bàn trống</span>
                )}
              <AvailabilityStatus availability={venue.availability} compact />
            </button>
          ))}
          {remoteReady && publishedSearch.isFetching && <p className="small">Đang tìm trên toàn hệ thống…</p>}
          {remoteReady && publishedSearch.isError && (
            <p role="alert">
              {publishedSearch.error.message}{' '}
              <button onClick={() => void publishedSearch.refetch()}>Thử lại</button>
            </p>
          )}
          {searching && publishedOnly.length > 0 && (
            <section className="published-results" aria-label="Kết quả ngoài vùng đã tải">
              <h2>Quán khác trên hệ thống</h2>
              {publishedOnly.map((venue) => (
                <button key={venue.slug} className="venue-card" onClick={() => selectPublishedVenue(venue)}>
                  <span className="venue-category">
                    {venue.category === 'CAFE'
                      ? 'Cà phê'
                      : venue.category === 'CINEMA'
                        ? 'Rạp phim'
                        : 'Nhà hàng'}
                  </span>
                  <strong>{venue.name}</strong>
                  <span>{venue.address}</span>
                  <span>
                    {ratingLabel(venue.rating)} · Xem trên bản đồ · Giá: {priceTierLabel(venue.priceTier)}
                  </span>
                </button>
              ))}
            </section>
          )}
          {remoteReady && publishedSearch.data?.meta.truncated && (
            <p className="small">Có thêm kết quả. Hãy nhập tên hoặc địa chỉ cụ thể hơn.</p>
          )}
          {!searching && !savedOnly && venues.hasNextPage && venueItems.length < 100 && (
            <button
              className="load-more"
              onClick={() => void venues.fetchNextPage()}
              disabled={venues.isFetchingNextPage}
            >
              {venues.isFetchingNextPage ? 'Đang tải thêm…' : 'Xem thêm địa điểm'}
            </button>
          )}
          {!searching && !savedOnly && venues.hasNextPage && venueItems.length >= 100 && (
            <p>Đã hiển thị 100 địa điểm. Hãy thu nhỏ khu vực để tìm cụ thể hơn.</p>
          )}
        </section>
        <div className="map-pane">
          <span className="map-radius-badge">Trong {filters.radiusM / 1000} km từ tâm bản đồ</span>
          <VenueMap
            lat={filters.lat}
            lng={filters.lng}
            venues={mapVenues}
            userLocation={userLocation}
            selectedId={selectedId}
            selectionSerial={selectionSerial}
            parkingFacilities={parkingItems}
            selectedParkingSlug={selectedParkingSlug}
            onCenterChange={onCenterChange}
            onSelect={selectVenue}
            onSelectParking={setSelectedParkingSlug}
          />
          {selected && (
            <aside ref={detailRef} className="map-selected" aria-label={`Chi tiết ${selected.name}`}>
              {venueDetail.data?.coverUrl && (
                <img
                  className="venue-cover"
                  src={venueDetail.data.coverUrl}
                  alt={`Ảnh bìa ${selected.name}`}
                />
              )}
              <div className="selected-heading">
                <div>
                  <span className="eyebrow">Địa điểm đang xem</span>
                  <h2>{selected.name}</h2>
                </div>
                <button
                  type="button"
                  className="close-detail"
                  aria-label="Đóng chi tiết"
                  onClick={() => {
                    update({ venue: null });
                  }}
                >
                  <X size={18} /> Đóng
                </button>
              </div>
              <span>{selected.address}</span>
              {venueDetail.data?.description && <p className="small">{venueDetail.data.description}</p>}
              {venueDetail.data?.cuisineTypes.length ? (
                <span className="small">
                  Loại món: {venueDetail.data.cuisineTypes.map((type) => cuisineLabels[type]).join(', ')}
                </span>
              ) : null}
              {venueDetail.data?.openingHours && (
                <span className="small">Giờ mở cửa: {venueDetail.data.openingHours}</span>
              )}
              {venueDetail.data?.menuSummary && <p className="small">Menu: {venueDetail.data.menuSummary}</p>}
              {!adsHidden && venueDetail.data?.promotion && (
                <p className="promotion-label">
                  {venueDetail.data.promotion.sponsored && 'Được tài trợ · '}
                  {venueDetail.data.promotion.text}
                </p>
              )}
              <FavoriteButton slug={selected.slug} userId={auth.data?.id ?? null} />
              <ShareVenueButton
                slug={selected.slug}
                lat={selected.location.coordinates[1]}
                lng={selected.location.coordinates[0]}
              />
              {selectedDirections && (
                <a
                  className="directions-link"
                  href={selectedDirections}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Chỉ đường đến địa điểm ↗
                </a>
              )}
              <Link to={`/business/claims?slug=${encodeURIComponent(selected.slug)}`}>
                Bạn là chủ quán này?
              </Link>
              <AvailabilityStatus availability={selected.availability} />
              <AvailabilityHistory key={`history-${selected.slug}`} slug={selected.slug} />
              {selected.category !== 'CINEMA' && (
                <BookingPanel
                  key={`booking-${selected.slug}`}
                  slug={selected.slug}
                  userId={auth.data?.id ?? null}
                />
              )}
              <CheckInPanel slug={selected.slug} signedIn={Boolean(auth.data)} />
              <ParkingFilters value={parkingFilters} onChange={updateParkingFilters} />
              {parking.isPending && <p className="small">Đang tìm bãi đỗ xe…</p>}
              {parking.isError && (
                <p role="alert">
                  {parking.error.message} <button onClick={() => void parking.refetch()}>Thử lại</button>
                </p>
              )}
              {parking.data && (
                <>
                  <ParkingList
                    facilities={parkingItems}
                    selectedSlug={selectedParkingSlug}
                    onSelect={setSelectedParkingSlug}
                    userCoordinates={userCoordinates}
                    venueSlug={selected.slug}
                    signedIn={Boolean(auth.data)}
                    premium={entitlements.data?.entitlements['parking.reserve'] === true}
                  />
                  {parking.hasNextPage && parkingItems.length < 100 && (
                    <button
                      className="load-more"
                      onClick={() => void parking.fetchNextPage()}
                      disabled={parking.isFetchingNextPage}
                    >
                      {parking.isFetchingNextPage ? 'Đang tải thêm…' : 'Xem thêm bãi xe'}
                    </button>
                  )}
                  {parking.hasNextPage && parkingItems.length >= 100 && (
                    <p className="small">Đã hiển thị 100 bãi xe. Hãy thu nhỏ khu vực để tìm cụ thể hơn.</p>
                  )}
                </>
              )}
              <NearbySuggestions items={suggestions} onSelect={selectVenue} />
              <ReviewPanel
                key={`review-${selected.slug}`}
                slug={selected.slug}
                userId={auth.data?.id ?? null}
              />
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
