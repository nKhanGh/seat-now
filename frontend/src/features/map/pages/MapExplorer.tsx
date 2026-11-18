import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentUser, useLogout } from '../../auth/api/authQueries';
import { useNearbyVenues } from '../api/mapQueries';
import { VenueMap } from '../components/VenueMap';
import { MapFilters } from '../services/map.service';

const DEFAULT_LAT = 10.7769;
const DEFAULT_LNG = 106.7009;
const readNumber = (value: string | null, fallback: number) => value !== null && Number.isFinite(Number(value)) ? Number(value) : fallback;

export function MapExplorer() {
  const [params, setParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const auth = useCurrentUser();
  const logout = useLogout();
  const filters = useMemo<MapFilters>(() => ({
    lat: readNumber(params.get('lat'), DEFAULT_LAT),
    lng: readNumber(params.get('lng'), DEFAULT_LNG),
    radiusM: readNumber(params.get('radiusM'), 3000),
    category: params.get('category') || undefined,
    priceTier: Number(params.get('priceTier')) || undefined,
    ratingGte: Number(params.get('ratingGte')) || undefined,
    crowdLevel: params.get('crowdLevel') || undefined,
    hasAvailability: params.get('hasAvailability') === 'true',
  }), [params]);
  const venues = useNearbyVenues(filters);
  const update = useCallback((patch: Record<string, string | null>) => {
    setParams((current) => {
      const next = new URLSearchParams(current);
      for (const [key, value] of Object.entries(patch)) value ? next.set(key, value) : next.delete(key);
      return next;
    }, { replace: true });
  }, [setParams]);
  const onCenterChange = useCallback((lat: number, lng: number) => update({ lat: String(lat), lng: String(lng) }), [update]);

  function locate() {
    if (!navigator.geolocation) { setLocationMessage('Trình duyệt không hỗ trợ vị trí.'); return; }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { update({ lat: String(Number(coords.latitude.toFixed(5))), lng: String(Number(coords.longitude.toFixed(5))) }); setLocationMessage('Đã cập nhật vị trí.'); },
      () => setLocationMessage('Không lấy được vị trí. Bạn vẫn có thể khám phá khu vực mặc định.'),
      { timeout: 8000 },
    );
  }

  const selected = venues.data?.data.find((item) => item.id === selectedId);
  return <main className="explorer">
    <header className="explorer-header"><Link to="/" className="brand">SeatNow</Link><nav>{auth.data ? <><span>Chào {auth.data.displayName}</span><button onClick={() => logout.mutate()} disabled={logout.isPending}>Đăng xuất</button></> : <><Link to="/login">Đăng nhập</Link><Link to="/register">Đăng ký</Link></>}</nav></header>
    <section className="filterbar" aria-label="Bộ lọc địa điểm">
      <select aria-label="Loại địa điểm" value={filters.category || ''} onChange={(event) => update({ category: event.target.value })}><option value="">Tất cả loại</option><option value="RESTAURANT">Nhà hàng</option><option value="CAFE">Cà phê</option><option value="CINEMA">Rạp phim</option></select>
      <select aria-label="Bán kính" value={filters.radiusM} onChange={(event) => update({ radiusM: event.target.value })}><option value="1000">1 km</option><option value="3000">3 km</option><option value="5000">5 km</option><option value="10000">10 km</option></select>
      <select aria-label="Mức giá" value={filters.priceTier || ''} onChange={(event) => update({ priceTier: event.target.value })}><option value="">Mọi mức giá</option><option value="1">₫</option><option value="2">₫₫</option><option value="3">₫₫₫</option><option value="4">₫₫₫₫</option></select>
      <select aria-label="Đánh giá tối thiểu" value={filters.ratingGte || ''} onChange={(event) => update({ ratingGte: event.target.value })}><option value="">Mọi đánh giá</option><option value="4">Từ 4 sao</option><option value="4.5">Từ 4.5 sao</option></select>
      <select aria-label="Độ đông" value={filters.crowdLevel || ''} onChange={(event) => update({ crowdLevel: event.target.value })}><option value="">Mọi độ đông</option><option value="QUIET">Vắng</option><option value="MODERATE">Vừa</option><option value="BUSY">Đông</option><option value="FULL">Đầy</option></select>
      <label className="filter-check"><input type="checkbox" checked={filters.hasAvailability} onChange={(event) => update({ hasAvailability: event.target.checked ? 'true' : null })} /> Còn bàn</label>
      <button onClick={locate}>Vị trí của tôi</button>
    </section>
    {locationMessage && <p role="status" className="location-message">{locationMessage}</p>}
    <div className="explorer-body"><section className="venue-list" aria-label="Danh sách địa điểm">
      <h1>Khám phá quanh bạn</h1><p className="small">Dữ liệu mẫu hư cấu tại Quận 1, TP.HCM. Tình trạng chỗ ngồi chưa kết nối nguồn trực tiếp.</p>
      {venues.isPending && <p>Đang tìm địa điểm…</p>}
      {venues.isError && <p role="alert">{venues.error.message} <button onClick={() => venues.refetch()}>Thử lại</button></p>}
      {venues.data?.data.length === 0 && <p>Không có địa điểm trong khu vực hoặc bộ lọc này.</p>}
      {venues.data?.data.map((venue) => <button key={venue.id} className={`venue-card${selectedId === venue.id ? ' selected' : ''}`} onClick={() => setSelectedId(venue.id)}>
        <span className="venue-category">{venue.category === 'CAFE' ? 'Cà phê' : venue.category === 'CINEMA' ? 'Rạp phim' : 'Nhà hàng'}</span><strong>{venue.name}</strong><span>{venue.address}</span><span>★ {venue.rating.toFixed(1)} · {venue.distanceM} m · {'₫'.repeat(venue.priceTier)}</span><span>{venue.availability.freshness === 'FRESH' && venue.availability.tablesAvailable !== null ? `${venue.availability.tablesAvailable} bàn trống (dữ liệu demo)` : 'Chưa có dữ liệu chỗ ngồi mới'}</span>
      </button>)}
      {venues.data?.meta.truncated && <p>Hãy thu nhỏ khu vực tìm kiếm để xem thêm địa điểm.</p>}
    </section><div className="map-pane"><VenueMap lat={filters.lat} lng={filters.lng} venues={venues.data?.data || []} selectedId={selectedId} onCenterChange={onCenterChange} onSelect={setSelectedId} />{selected && <div className="map-selected"><strong>{selected.name}</strong><span>{selected.address}</span><button onClick={() => setSelectedId(null)}>Đóng</button></div>}</div></div>
  </main>;
}
