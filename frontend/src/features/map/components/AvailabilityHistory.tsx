import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAvailabilityHistory } from '../services/map.service';

const crowdLabels: Record<string, string> = {
  QUIET: 'Vắng',
  MODERATE: 'Vừa phải',
  BUSY: 'Đông',
  FULL: 'Đầy',
  UNKNOWN: 'Chưa rõ',
};

export function AvailabilityHistory({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const history = useQuery({
    queryKey: ['venues', slug, 'availability-history'],
    queryFn: ({ signal }) => getAvailabilityHistory(slug, signal),
    enabled: open,
    staleTime: 60_000,
  });

  return (
    <section className="availability-history" aria-label="Lịch sử chỗ ngồi">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? 'Ẩn lịch sử chỗ ngồi' : 'Xem lịch sử chỗ ngồi 24 giờ'}
      </button>
      {open && (
        <div>
          <p className="small">Các lần ghi nhận trước, không dự báo tình trạng hiện tại.</p>
          {history.isPending && <p>Đang tải lịch sử…</p>}
          {history.isError && (
            <p role="alert">
              {history.error.message} <button onClick={() => void history.refetch()}>Thử lại</button>
            </p>
          )}
          {history.data?.data.length === 0 && <p>Chưa có lần ghi nhận nào trong 24 giờ qua.</p>}
          {history.data?.data.map((record) => (
            <div key={record.version} className="availability-history-row">
              <span>{new Date(record.capturedAt).toLocaleString('vi-VN')}</span>
              <strong>{crowdLabels[record.crowdLevel] ?? 'Chưa rõ'}</strong>
              <span>
                {record.tables
                  ? `${record.tables.available}/${record.tables.total} bàn`
                  : record.seats
                    ? `${record.seats.available}/${record.seats.total} ghế`
                    : 'Chưa rõ số chỗ'}
              </span>
              <span className="small">
                {record.source === 'DEMO'
                  ? 'Dữ liệu mẫu'
                  : record.source === 'OPERATOR'
                    ? 'Chủ quán'
                    : 'Hệ thống quán'}
              </span>
            </div>
          ))}
          {history.data?.meta.truncated && <p className="small">Đang hiển thị 10 lần ghi nhận mới nhất.</p>}
        </div>
      )}
    </section>
  );
}
