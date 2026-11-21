import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useBookingStatus, useCreateBooking } from '../api/bookingQueries';
import { BookingPanel } from './BookingPanel';

vi.mock('../api/bookingQueries', () => ({
  useBookingStatus: vi.fn(),
  useCreateBooking: vi.fn(),
}));

function render() {
  return renderToStaticMarkup(
    <MemoryRouter>
      <BookingPanel slug="demo-hcm-028" userId="signed-in-user" />
    </MemoryRouter>,
  );
}

describe('booking availability in venue detail', () => {
  beforeEach(() => {
    vi.mocked(useCreateBooking).mockReturnValue({ isPending: false, isError: false } as ReturnType<
      typeof useCreateBooking
    >);
  });

  it('explains why a venue has no booking form', () => {
    vi.mocked(useBookingStatus).mockReturnValue({ data: { enabled: false } } as ReturnType<
      typeof useBookingStatus
    >);
    const html = render();
    expect(html).toContain('Yêu cầu đặt bàn');
    expect(html).toContain('Quán này chưa mở nhận yêu cầu đặt bàn.');
    expect(html).toContain('/business/venues/demo-hcm-028/bookings');
    expect(html).not.toContain('Gửi yêu cầu');
  });

  it('shows the request form only after the owner enables bookings', () => {
    vi.mocked(useBookingStatus).mockReturnValue({ data: { enabled: true } } as ReturnType<
      typeof useBookingStatus
    >);
    const html = render();
    expect(html).toContain('Thời gian đến');
    expect(html).toContain('Số khách');
    expect(html).toContain('Gửi yêu cầu');
    expect(html).not.toContain('Quán này chưa mở nhận yêu cầu đặt bàn.');
  });
});
