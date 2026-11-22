import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCreateParkingReservation } from '../api/parkingReservationQueries';
import { ParkingFacilityItem } from '../services/parking.service';

function localInput(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function ParkingReservationPanel({
  facility,
  venueSlug,
  signedIn,
  premium,
}: {
  facility: ParkingFacilityItem;
  venueSlug: string;
  signedIn: boolean;
  premium: boolean;
}) {
  const [startsAt, setStartsAt] = useState(() => localInput(new Date(Date.now() + 45 * 60_000)));
  const [endsAt, setEndsAt] = useState(() => localInput(new Date(Date.now() + 105 * 60_000)));
  const [vehicleType, setVehicleType] = useState<'CAR' | 'MOTORBIKE'>(
    facility.vehicleTypes[0] ?? 'MOTORBIKE',
  );
  const [notice, setNotice] = useState('');
  const create = useCreateParkingReservation();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice('');
    try {
      await create.mutateAsync({
        slug: venueSlug,
        facilitySlug: facility.slug,
        input: {
          vehicleType,
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
        },
      });
      setNotice('Đã gửi yêu cầu. Chỉ khi chủ quán xác nhận mới có chỗ được giữ trong bản demo.');
    } catch {
      /* The mutation error is displayed below. */
    }
  }

  return (
    <section className="parking-reservation-panel" aria-label={`Giữ chỗ xe tại ${facility.name}`}>
      <h3>Yêu cầu giữ chỗ xe · Premium</h3>
      <p className="small">
        Chỉ hỗ trợ bãi của quán có dữ liệu chỗ trống mới. Yêu cầu cần chủ quán xác nhận; không có giá trị giữ
        xe ngoài đời.
      </p>
      {!signedIn ? (
        <p>
          <AuthLink>Đăng nhập</AuthLink> để gửi yêu cầu.
        </p>
      ) : !premium ? (
        <p>
          <Link to="/plans">Xem quyền Premium</Link> để dùng tính năng này.
        </p>
      ) : (
        <form onSubmit={(event) => void submit(event)}>
          <label>
            Loại xe
            <select
              value={vehicleType}
              onChange={(event) => setVehicleType(event.target.value as 'CAR' | 'MOTORBIKE')}
            >
              {facility.vehicleTypes.map((type) => (
                <option value={type} key={type}>
                  {type === 'CAR' ? 'Ô tô' : 'Xe máy'}
                </option>
              ))}
            </select>
          </label>
          <label>
            Giờ đến
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              required
            />
          </label>
          <label>
            Giờ rời
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(event) => setEndsAt(event.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            className="primary"
            disabled={
              create.isPending ||
              facility.availability.freshness !== 'FRESH' ||
              !facility.availability.availableSpaces
            }
          >
            {create.isPending ? 'Đang gửi…' : 'Gửi yêu cầu giữ xe'}
          </button>
          {(facility.availability.freshness !== 'FRESH' || !facility.availability.availableSpaces) && (
            <p className="small">Bãi hiện chưa có dữ liệu chỗ trống mới hoặc đã hết chỗ.</p>
          )}
        </form>
      )}
      {create.isError && (
        <p role="alert" className="error">
          {create.error.message}
        </p>
      )}
      {notice && (
        <p role="status" className="notice">
          {notice} <Link to="/parking-reservations">Xem yêu cầu</Link>
        </p>
      )}
    </section>
  );
}
