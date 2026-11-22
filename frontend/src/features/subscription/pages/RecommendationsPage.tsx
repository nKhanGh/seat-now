import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { AuthLink } from '../../auth/components/AuthLink';
import { priceTierLabel } from '../../../shared/priceTier';
import { useEntitlements } from '../api/subscriptionQueries';
import { getRecommendations, RecommendationPreferences } from '../services/recommendation.service';

function coordinate(value: string | null, fallback: number) {
  const number = Number(value);
  return value !== null && Number.isFinite(number) ? number : fallback;
}

export function RecommendationsPage() {
  const [params] = useSearchParams();
  const auth = useCurrentUser();
  const entitlements = useEntitlements(Boolean(auth.data));
  const [preferences, setPreferences] = useState<RecommendationPreferences>(() => ({
    lat: coordinate(params.get('lat'), 10.7769),
    lng: coordinate(params.get('lng'), 106.7009),
    cuisine: '',
    maxPriceTier: 0,
    partySize: 2,
  }));
  const [locationMessage, setLocationMessage] = useState('');
  const premium = entitlements.data?.entitlements['recommendation.advanced'] === true;
  const recommendations = useQuery({
    queryKey: ['premium', 'recommendations', preferences],
    queryFn: ({ signal }) => getRecommendations(preferences, signal),
    enabled: premium,
    staleTime: 60_000,
  });

  function locate() {
    if (!navigator.geolocation) return setLocationMessage('Trình duyệt không hỗ trợ vị trí.');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPreferences((current) => ({ ...current, lat: coords.latitude, lng: coords.longitude }));
        setLocationMessage('Đã dùng vị trí hiện tại để gợi ý.');
      },
      () => setLocationMessage('Không lấy được vị trí. Đang dùng khu vực trên bản đồ.'),
      { timeout: 8000 },
    );
  }

  return (
    <main className="plans-page recommendations-page">
      <header className="plans-header">
        <Link to="/" className="brand">
          SeatNow
        </Link>
        <Link to="/">Về bản đồ</Link>
      </header>
      <section className="plans-hero">
        <p className="eyebrow">Dành cho Premium</p>
        <h1>Gợi ý hợp với bạn</h1>
        <p>
          Chọn khẩu vị, ngân sách và số người. Kết quả dựa trên khoảng cách, đánh giá, chỗ trống cùng quán bạn
          đã lưu hoặc đánh giá tốt.
        </p>
        <p className="small">
          Bản demo dùng quy tắc xếp hạng minh bạch; chưa tích hợp mô hình AI. Dữ liệu chỗ ngồi mẫu không phản
          ánh ngoài đời.
        </p>
      </section>
      {auth.isPending || (auth.data && entitlements.isPending) ? <p>Đang kiểm tra gói của bạn…</p> : null}
      {!auth.isPending && !auth.data && (
        <p className="notice">
          <AuthLink>Đăng nhập</AuthLink> để xem gợi ý Premium.
        </p>
      )}
      {entitlements.isError && (
        <p role="alert" className="error">
          Không kiểm tra được gói. <button onClick={() => void entitlements.refetch()}>Thử lại</button>
        </p>
      )}
      {auth.data && !entitlements.isPending && !entitlements.isError && !premium && (
        <p className="notice">
          Tính năng dành cho tài khoản Premium demo. <Link to="/plans">Xem các gói</Link>.
        </p>
      )}
      {premium && (
        <>
          <section className="recommendation-preferences" aria-label="Sở thích gợi ý">
            <label>
              Loại món
              <select
                value={preferences.cuisine}
                onChange={(event) =>
                  setPreferences((current) => ({ ...current, cuisine: event.target.value }))
                }
              >
                <option value="">Tất cả</option>
                <option value="VIETNAMESE">Món Việt</option>
                <option value="WESTERN">Món Âu</option>
                <option value="COFFEE">Cà phê</option>
                <option value="DESSERT">Tráng miệng</option>
              </select>
            </label>
            <label>
              Ngân sách
              <select
                value={preferences.maxPriceTier}
                onChange={(event) =>
                  setPreferences((current) => ({ ...current, maxPriceTier: Number(event.target.value) }))
                }
              >
                <option value={0}>Không giới hạn</option>
                <option value={1}>Mức 1 · Bình dân</option>
                <option value={2}>Mức 2 · Tầm trung</option>
                <option value={3}>Mức 3 · Cao</option>
                <option value={4}>Mức 4 · Rất cao</option>
              </select>
            </label>
            <label>
              Số người
              <input
                type="number"
                min={1}
                max={12}
                value={preferences.partySize}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    partySize: Math.min(12, Math.max(1, Number(event.target.value) || 1)),
                  }))
                }
              />
            </label>
            <button type="button" onClick={locate}>
              Dùng vị trí của tôi
            </button>
          </section>
          {locationMessage && (
            <p role="status" className="small">
              {locationMessage}
            </p>
          )}
          {recommendations.isPending && <p>Đang tìm gợi ý…</p>}
          {recommendations.isError && (
            <p role="alert" className="error">
              {recommendations.error.message}{' '}
              <button onClick={() => void recommendations.refetch()}>Thử lại</button>
            </p>
          )}
          {recommendations.data?.data.length === 0 && (
            <p>Chưa tìm được quán phù hợp trong bán kính 20 km. Hãy chọn khu vực khác.</p>
          )}
          <div className="recommendation-grid">
            {recommendations.data?.data.map((venue) => (
              <article className="recommendation-card" key={venue.slug}>
                <span className="eyebrow">
                  {venue.category === 'CAFE'
                    ? 'Cà phê'
                    : venue.category === 'CINEMA'
                      ? 'Rạp phim'
                      : 'Nhà hàng'}
                </span>
                <h2>{venue.name}</h2>
                <p className="small">{venue.address}</p>
                <p>
                  ★ {venue.rating.toFixed(1)} · {priceTierLabel(venue.priceTier)} · Cách{' '}
                  {venue.distanceM < 1000
                    ? `${venue.distanceM} m`
                    : `${(venue.distanceM / 1000).toFixed(1)} km`}
                </p>
                <div className="recommendation-reasons">
                  {venue.reasons.map((reason) => (
                    <span key={reason}>{reason}</span>
                  ))}
                </div>
                <Link
                  to={`/?lat=${preferences.lat}&lng=${preferences.lng}&venue=${encodeURIComponent(venue.slug)}`}
                >
                  Xem trên bản đồ ↗
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
