import { VenueMapItem } from '../services/map.service';

type Availability = VenueMapItem['availability'];

const crowdLabels: Record<Availability['crowdLevel'], string> = {
  QUIET: 'Vắng',
  MODERATE: 'Vừa',
  BUSY: 'Đông',
  FULL: 'Đầy',
  UNKNOWN: 'Chưa rõ',
};

export function AvailabilityStatus({
  availability,
  compact = false,
}: {
  availability: Availability;
  compact?: boolean;
}) {
  if (availability.freshness === 'UNKNOWN')
    return <span className="availability-unknown">Chưa có dữ liệu chỗ ngồi</span>;
  const stale = availability.freshness === 'STALE';
  const capacity = [
    availability.tablesAvailable !== null
      ? `${availability.tablesAvailable}/${availability.tablesTotal} bàn`
      : null,
    availability.seatsAvailable !== null
      ? `${availability.seatsAvailable}/${availability.seatsTotal} ghế`
      : null,
  ]
    .filter(Boolean)
    .join(' · ');
  if (compact)
    return (
      <span
        className={
          stale ? 'availability-stale' : `availability-fresh crowd-${availability.crowdLevel.toLowerCase()}`
        }
      >
        {stale ? 'Dữ liệu cũ' : crowdLabels[availability.crowdLevel]}
        {capacity && ` · ${capacity}`}
      </span>
    );
  return (
    <section
      className={`availability-detail${stale ? '' : ` crowd-${availability.crowdLevel.toLowerCase()}`}`}
      aria-label="Tình trạng chỗ ngồi"
    >
      <strong>{stale ? 'Dữ liệu chỗ ngồi đã cũ' : `Độ đông: ${crowdLabels[availability.crowdLevel]}`}</strong>
      <span>
        {stale ? 'Lần cuối ghi nhận' : 'Hiện ghi nhận'}: {capacity || 'chưa rõ số chỗ'}
      </span>
      {availability.estimatedWaitMinutes !== null && (
        <span>Thời gian chờ ước tính: {availability.estimatedWaitMinutes} phút</span>
      )}
      {availability.acceptingGuests === false && <span>Hiện chưa nhận thêm khách</span>}
      <small>
        {availability.source === 'DEMO'
          ? 'Dữ liệu mô phỏng'
          : availability.source === 'OPERATOR'
            ? 'Chủ địa điểm cập nhật'
            : 'Hệ thống quản lý cập nhật'}
        {availability.capturedAt && ` · ${new Date(availability.capturedAt).toLocaleString('vi-VN')}`}
        {availability.confidence !== null && ` · Tin cậy ${Math.round(availability.confidence * 100)}%`}
      </small>
    </section>
  );
}
