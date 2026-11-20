import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../auth/api/authQueries';
import { useHcmVenuePins, useNearbyVenues, usePublishedVenueSearch, useVenueDetail } from '../api/mapQueries';
import { VenueMap } from '../components/VenueMap';
import { AvailabilityStatus } from '../components/AvailabilityStatus';
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
  const auth = useCurrentUser();
  const favorites = useFavorites(auth.data?.id ?? null);
  const logout = useLogout();
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
    }),
    [params],
  );
  const venues = useNearbyVenues(filters);
  const catalog = useHcmVenuePins(filters);
  const venueItems = useMemo(() => venues.data?.pages.flatMap((page) => page.data) ?? [], [venues.data]);
  const filterSignature = JSON.stringify([
    filters.category,
    filters.cuisine,
    filters.priceTier,
    filters.ratingGte,
    filters.crowdLevel,
    filters.hasAvailability,
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
  const savedRequested = params.get('saved') === 'true';
  const savedOnly = savedRequested && Boolean(auth.data);
  const favoriteSlugs = useMemo(
    () => new Set(favorites.data?.map((venue) => venue.slug) ?? []),
    [favorites.data],
  );
  const hasActiveFilters =
    searching ||
    savedRequested ||
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
    const candidates = searching
      ? searchVenues(seenVenues, searchText)
      : savedOnly
        ? seenVenues
        : [...venueItems].sort(
            (a, b) =>
              Number(Boolean(b.promotion?.sponsored)) - Number(Boolean(a.promotion?.sponsored)) ||
              a.distanceM - b.distanceM,
          );
    return savedOnly ? candidates.filter((venue) => favoriteSlugs.has(venue.slug)) : candidates;
  }, [searching, searchText, savedOnly, seenVenues, venueItems, favoriteSlugs]);
  const mapVenues = useMemo(
    () =>
      savedOnly
        ? seenVenues.filter((venue) => favoriteSlugs.has(venue.slug) || venue.slug === params.get('venue'))
        : seenVenues,
    [savedOnly, seenVenues, favoriteSlugs, params],
  );
  const publishedOnly = useMemo(() => {
    if (!remoteReady) return [];
    const knownSlugs = new Set(displayedVenues.map((venue) => venue.slug));
    return (
      publishedSearch.data?.data.filter(
        (venue) => !knownSlugs.has(venue.slug) && (!savedOnly || favoriteSlugs.has(venue.slug)),
      ) ?? []
    );
  }, [displayedVenues, publishedSearch.data, remoteReady, savedOnly, favoriteSlugs]);
  const selected = seenVenues.find((item) => item.slug === params.get('venue'));
  const selectedId = selected?.id ?? null;
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
    (lat: number, lng: number) => update({ lat: String(lat), lng: String(lng) }),
    [update],
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
        <Link to="/" className="brand">
          SeatNow
        </Link>
        <nav>
          <span className="sync-status" role="status">
            {liveStatus === 'connected'
              ? 'Cập nhật trực tiếp'
              : liveStatus === 'offline'
                ? 'Đồng bộ định kỳ'
                : 'Đang kết nối'}
          </span>
          <Link to="/plans">Gói người dùng</Link>
          <Link to={`/proposals?lat=${filters.lat}&lng=${filters.lng}`}>Đề xuất quán</Link>
          <Link to="/business">Chủ quán</Link>
          {auth.data ? (
            <>
              <Link to="/favorites">Quán đã lưu</Link>
              <Link to="/bookings">Đặt bàn của tôi</Link>
              <Link to="/following">Đang theo dõi</Link>
              <span>Chào {auth.data.displayName}</span>
              <button onClick={() => logout.mutate()} disabled={logout.isPending}>
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </>
          )}
        </nav>
      </header>
      <section className="filterbar" aria-label="Bộ lọc địa điểm">
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
        <select
          aria-label="Loại địa điểm"
          value={filters.category || ''}
          onChange={(event) => update({ category: event.target.value })}
        >
          <option value="">Tất cả loại</option>
          <option value="RESTAURANT">Nhà hàng</option>
          <option value="CAFE">Cà phê</option>
          <option value="CINEMA">Rạp phim</option>
        </select>
        <select
          aria-label="Loại món"
          value={filters.cuisine || ''}
          onChange={(event) => update({ cuisine: event.target.value })}
        >
          <option value="">Tất cả món</option>
          <option value="VIETNAMESE">Món Việt</option>
          <option value="WESTERN">Món Âu</option>
          <option value="COFFEE">Cà phê</option>
          <option value="DESSERT">Tráng miệng</option>
        </select>
        <select
          aria-label="Bán kính"
          value={filters.radiusM}
          onChange={(event) => update({ radiusM: event.target.value })}
        >
          <option value="1000">1 km</option>
          <option value="3000">3 km</option>
          <option value="5000">5 km</option>
          <option value="10000">10 km</option>
        </select>
        <select
          aria-label="Mức giá"
          value={filters.priceTier || ''}
          onChange={(event) => update({ priceTier: event.target.value })}
        >
          <option value="">Mọi mức giá</option>
          <option value="1">₫</option>
          <option value="2">₫₫</option>
          <option value="3">₫₫₫</option>
          <option value="4">₫₫₫₫</option>
        </select>
        <select
          aria-label="Đánh giá tối thiểu"
          value={filters.ratingGte || ''}
          onChange={(event) => update({ ratingGte: event.target.value })}
        >
          <option value="">Mọi đánh giá</option>
          <option value="4">Từ 4 sao</option>
          <option value="4.5">Từ 4.5 sao</option>
        </select>
        <select
          aria-label="Độ đông"
          value={filters.crowdLevel || ''}
          onChange={(event) => update({ crowdLevel: event.target.value })}
        >
          <option value="">Mọi độ đông</option>
          <option value="QUIET">Vắng</option>
          <option value="MODERATE">Vừa</option>
          <option value="BUSY">Đông</option>
          <option value="FULL">Đầy</option>
        </select>
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
      <div className="explorer-body">
        <section className="venue-list" aria-label="Danh sách địa điểm">
          <h1>Khám phá quanh bạn</h1>
          <p className="small">
            Dữ liệu mẫu hư cấu tại nhiều khu vực TP.HCM. Tình trạng chỗ ngồi chưa kết nối nguồn trực tiếp.
          </p>
          {searching && (
            <p className="small">Tìm trong các địa điểm đã tải · {displayedVenues.length} kết quả.</p>
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
          {!searching && venues.isError && (
            <p role="alert">
              {venues.error.message} <button onClick={() => void venues.refetch()}>Thử lại</button>
            </p>
          )}
          {!searching && !savedOnly && venues.data?.pages[0]?.data.length === 0 && (
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
                ★ {venue.rating.toFixed(1)} ·{' '}
                {searching || savedOnly ? 'Xem trên bản đồ' : `${venue.distanceM} m`} ·{' '}
                {'₫'.repeat(venue.priceTier)}
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
                    ★ {venue.rating.toFixed(1)} · Xem trên bản đồ · {'₫'.repeat(venue.priceTier)}
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
            <aside className="map-selected" aria-label={`Chi tiết ${selected.name}`}>
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
              {venueDetail.data?.promotion && (
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
              <Link to={`/business?slug=${encodeURIComponent(selected.slug)}`}>Bạn là chủ quán này?</Link>
              <AvailabilityStatus availability={selected.availability} />
              {selected.category !== 'CINEMA' && (
                <BookingPanel key={selected.slug} slug={selected.slug} userId={auth.data?.id ?? null} />
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
              <ReviewPanel key={selected.slug} slug={selected.slug} userId={auth.data?.id ?? null} />
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
