import { FormEvent, useEffect, useState } from 'react';
import { useOwnedParkingFacilities, useUpdateParkingAvailability } from '../api/parkingReservationQueries';

export function ParkingAvailabilityEditor({ slug }: { slug: string }) {
  const facilities = useOwnedParkingFacilities(slug);
  const update = useUpdateParkingAvailability(slug);
  const [facilitySlug, setFacilitySlug] = useState('');
  const [totalSpaces, setTotalSpaces] = useState(0);
  const [availableSpaces, setAvailableSpaces] = useState(0);
  const [notice, setNotice] = useState('');
  const selected = facilities.data?.find((facility) => facility.slug === facilitySlug);

  useEffect(() => {
    const first = facilities.data?.[0];
    if (first && !facilitySlug) setFacilitySlug(first.slug);
  }, [facilities.data, facilitySlug]);

  useEffect(() => {
    if (!selected) return;
    setTotalSpaces(selected.totalSpaces ?? 0);
    setAvailableSpaces(selected.availableSpaces ?? 0);
  }, [selected?.slug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    try {
      await update.mutateAsync({ facilitySlug, totalSpaces, availableSpaces });
      setNotice('Đã cập nhật chỗ xe. Dữ liệu có hiệu lực trong 10 phút.');
    } catch {
      /* Mutation error is displayed below. */
    }
  }

  return (
    <section className="card business-form" aria-label="Cập nhật chỗ xe của quán">
      <h3>Chỗ xe hiện tại</h3>
      <p>Chọn bãi thuộc quán và nhập số chỗ thực tế. Dữ liệu tự cũ sau 10 phút.</p>
      {facilities.isPending && <p>Đang tải bãi xe…</p>}
      {facilities.isError && (
        <p role="alert" className="error">
          {facilities.error.message}
        </p>
      )}
      {facilities.data?.length === 0 && <p>Quán chưa có bãi xe thuộc quyền quản lý trong hệ thống.</p>}
      {facilities.data && facilities.data.length > 0 && (
        <form onSubmit={(event) => void submit(event)}>
          <label>
            Bãi xe
            <select value={facilitySlug} onChange={(event) => setFacilitySlug(event.target.value)} required>
              {facilities.data.map((facility) => (
                <option key={facility.slug} value={facility.slug}>
                  {facility.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tổng số chỗ
            <input
              type="number"
              min={0}
              value={totalSpaces}
              onChange={(event) => setTotalSpaces(Number(event.target.value))}
              required
            />
          </label>
          <label>
            Chỗ đang trống
            <input
              type="number"
              min={0}
              max={totalSpaces}
              value={availableSpaces}
              onChange={(event) => setAvailableSpaces(Number(event.target.value))}
              required
            />
          </label>
          <button className="primary" disabled={update.isPending || !facilitySlug}>
            {update.isPending ? 'Đang lưu…' : 'Lưu chỗ xe'}
          </button>
        </form>
      )}
      {update.isError && (
        <p role="alert" className="error">
          {update.error.message}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
    </section>
  );
}
