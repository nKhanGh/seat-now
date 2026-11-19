import { useState } from 'react';
import { ParkingFacilityItem } from '../services/parking.service';

const relationLabels: Record<ParkingFacilityItem['relation'], string> = {
  VENUE: 'Bãi của địa điểm', PARTNER: 'Bãi đối tác', PUBLIC: 'Bãi công cộng',
};

function priceLabel(pricing: ParkingFacilityItem['pricing']) {
  if (pricing.kind === 'FREE') return 'Miễn phí';
  if (pricing.kind === 'UNKNOWN' || pricing.amountMinor === null || pricing.currency === null) return 'Chưa có thông tin giá';
  const amount = new Intl.NumberFormat('vi-VN').format(pricing.amountMinor);
  return `${amount} ${pricing.currency}${pricing.unit === 'HOUR' ? '/giờ' : pricing.unit === 'VISIT' ? '/lượt' : ''}`;
}

function availabilityLabel(availability: ParkingFacilityItem['availability']) {
  if (availability.freshness === 'UNKNOWN' || availability.availableSpaces === null) return 'Chưa rõ số chỗ trống';
  if (availability.freshness === 'STALE') return `Dữ liệu cũ · lần cuối ghi nhận ${availability.availableSpaces} chỗ`;
  return availability.availableSpaces === 0 ? 'Đã hết chỗ' : `Còn ${availability.availableSpaces}/${availability.totalSpaces} chỗ`;
}

export function ParkingList({ facilities, selectedSlug, onSelect }: { facilities: ParkingFacilityItem[]; selectedSlug: string | null; onSelect: (slug: string) => void }) {
  const [showAll, setShowAll] = useState(false);
  if (facilities.length === 0) return <p className="small">Không có bãi đỗ xe phù hợp trong bán kính 1,5 km.</p>;
  return <section className="parking-list" aria-label="Bãi đỗ xe gần địa điểm">
    <h2>Bãi đỗ xe gần đây</h2>
    <p className="small">Khoảng cách đường chim bay, chưa tính quãng đường đi thực tế.</p>
    {(showAll ? facilities : facilities.slice(0, 3)).map((facility) => <button key={facility.id} className={`parking-card${selectedSlug === facility.slug ? ' selected' : ''}`} onClick={() => onSelect(facility.slug)}>
      <strong>{facility.name}</strong>
      <span>{relationLabels[facility.relation]} · Cách khoảng {facility.distanceM} m</span>
      <span>{facility.vehicleTypes.map((type) => type === 'CAR' ? 'Ô tô' : 'Xe máy').join(', ')} · {priceLabel(facility.pricing)}</span>
      <span className={facility.availability.freshness === 'STALE' ? 'availability-stale' : facility.availability.freshness === 'FRESH' ? 'availability-fresh' : 'availability-unknown'}>{availabilityLabel(facility.availability)}</span>
      {selectedSlug === facility.slug && <span className="parking-extra">{facility.isOpenNow === true ? 'Mở 24 giờ' : 'Chưa rõ giờ mở cửa'}{facility.entranceNote && ` · ${facility.entranceNote}`}{facility.availability.capturedAt && ` · Cập nhật ${new Date(facility.availability.capturedAt).toLocaleString('vi-VN')}`}</span>}
    </button>)}
    {facilities.length > 3 && <button className="parking-show-all" onClick={() => setShowAll((current) => !current)}>{showAll ? 'Thu gọn' : `Xem tất cả ${facilities.length} bãi`}</button>}
  </section>;
}
