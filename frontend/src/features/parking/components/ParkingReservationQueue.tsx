import { useResolveParkingReservation, useVenueParkingReservations } from '../api/parkingReservationQueries';

export function ParkingReservationQueue({ slug }: { slug: string }) {
  const reservations = useVenueParkingReservations(slug);
  const resolve = useResolveParkingReservation(slug);
  return (
    <section className="card business-form" aria-label="Yêu cầu giữ xe của quán">
      <h3>Yêu cầu giữ xe</h3>
      <p>
        Kiểm tra số chỗ thực tế trước khi xác nhận. Hệ thống đối chiếu thêm snapshot chỗ trống và yêu cầu
        trùng giờ.
      </p>
      {reservations.isPending && <p>Đang tải yêu cầu…</p>}
      {reservations.isError && (
        <p role="alert" className="error">
          {reservations.error.message} <button onClick={() => void reservations.refetch()}>Thử lại</button>
        </p>
      )}
      {reservations.data?.length === 0 && <p>Không có yêu cầu đang chờ hoặc đã xác nhận.</p>}
      {reservations.data?.map((item) => (
        <article key={item.id} className="booking-row">
          <strong>{item.facilityName ?? item.facilitySlug}</strong>
          <span>
            {new Date(item.startsAt).toLocaleString('vi-VN')} –{' '}
            {new Date(item.endsAt).toLocaleString('vi-VN')}
          </span>
          <span>
            {item.vehicleType === 'CAR' ? 'Ô tô' : 'Xe máy'} ·{' '}
            {item.status === 'PENDING' ? 'Chờ xác nhận' : 'Đã xác nhận'}
          </span>
          <div className="booking-row-actions">
            {item.status === 'PENDING' ? (
              <>
                <button
                  type="button"
                  className="booking-action booking-action-confirm"
                  disabled={resolve.isPending}
                  onClick={() => resolve.mutate({ id: item.id, action: 'confirm' })}
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  className="booking-action booking-action-decline"
                  disabled={resolve.isPending}
                  onClick={() => resolve.mutate({ id: item.id, action: 'decline' })}
                >
                  Từ chối
                </button>
              </>
            ) : (
              <button
                type="button"
                className="booking-action"
                disabled={resolve.isPending}
                onClick={() => resolve.mutate({ id: item.id, action: 'complete' })}
              >
                Đã nhận xe
              </button>
            )}
          </div>
        </article>
      ))}
      {resolve.isError && (
        <p role="alert" className="error">
          {resolve.error.message}
        </p>
      )}
    </section>
  );
}
