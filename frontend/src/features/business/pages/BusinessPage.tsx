import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AuthLink } from '../../auth/components/AuthLink';
import { useCurrentUser } from '../../auth/api/authQueries';
import {
  useBusinessCampaign,
  useBusinessClaims,
  useBusinessDashboard,
  useBusinessVenues,
  useManualAvailability,
  useRequestBusinessClaim,
  useUpdateBusinessProfile,
  useUploadBusinessCover,
  useUploadBusinessLogo,
} from '../api/businessQueries';
import { BusinessProfileInput, BusinessVenue, ManualAvailabilityInput } from '../services/business.service';
import { BookingQueue } from '../../booking/components/BookingQueue';

function CampaignEditor({ venue, userId }: { venue: BusinessVenue; userId: string }) {
  const campaign = useBusinessCampaign(userId);
  const localDateTime = (time: number) =>
    new Date(time - new Date(time).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  const [text, setText] = useState(venue.promotion?.text ?? 'Ưu đãi giờ vắng tại quán');
  const [startsAt, setStartsAt] = useState(localDateTime(Date.now()));
  const [endsAt, setEndsAt] = useState(localDateTime(Date.now() + 60 * 60_000));
  const [sponsored, setSponsored] = useState(false);
  const [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    try {
      await campaign.save.mutateAsync({
        slug: venue.slug,
        input: {
          promotionText: text.trim(),
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          sponsored,
        },
      });
      setMessage('Đã hẹn giờ ưu đãi.');
    } catch {
      /* Error is shown below. */
    }
  }
  return (
    <form className="card business-form" onSubmit={(event) => void submit(event)}>
      <h3>Ưu đãi giờ vắng · {venue.name}</h3>
      <p>Ưu đãi xuất hiện trong app theo lịch. Quảng cáo được gắn nhãn “Được tài trợ”.</p>
      <label>
        Nội dung ưu đãi
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          minLength={10}
          maxLength={200}
          required
        />
      </label>
      <label>
        Bắt đầu
        <input
          type="datetime-local"
          value={startsAt}
          onChange={(event) => setStartsAt(event.target.value)}
          required
        />
      </label>
      <label>
        Kết thúc
        <input
          type="datetime-local"
          value={endsAt}
          onChange={(event) => setEndsAt(event.target.value)}
          required
        />
      </label>
      <label>
        <input type="checkbox" checked={sponsored} onChange={(event) => setSponsored(event.target.checked)} />{' '}
        Đẩy lên đầu danh sách được tài trợ
      </label>
      <button className="primary" disabled={campaign.save.isPending}>
        {campaign.save.isPending ? 'Đang lưu…' : 'Lên lịch ưu đãi'}
      </button>
      {venue.promotion && (
        <button
          type="button"
          disabled={campaign.remove.isPending}
          onClick={() => campaign.remove.mutate(venue.slug)}
        >
          Tắt ưu đãi hiện tại
        </button>
      )}
      {campaign.save.isError && <p role="alert">{campaign.save.error.message}</p>}
      {campaign.remove.isError && <p role="alert">{campaign.remove.error.message}</p>}
      {message && <p role="status">{message}</p>}
    </form>
  );
}

function Dashboard({ venue, userId }: { venue: BusinessVenue; userId: string }) {
  const dashboard = useBusinessDashboard(venue.slug, userId);
  const data = dashboard.data;
  const localHour = (hourUtc: number) => `${String((hourUtc + 7) % 24).padStart(2, '0')}:00`;
  return (
    <section className="card business-dashboard" aria-label={`Dashboard ${venue.name}`}>
      <h3>Dashboard · {venue.name}</h3>
      <p>7 ngày gần đây</p>
      {dashboard.isPending && <p>Đang tải thống kê…</p>}
      {dashboard.isError && (
        <p role="alert">
          {dashboard.error.message} <button onClick={() => void dashboard.refetch()}>Thử lại</button>
        </p>
      )}
      {data && (
        <>
          <p>
            <strong>{data.views.total}</strong> lượt mở trang chi tiết (không phải người dùng duy nhất).
          </p>
          <p>
            Tỷ lệ lấp đầy trung bình:{' '}
            <strong>
              {data.occupancy.averagePercent === null
                ? 'Chưa có dữ liệu'
                : `${data.occupancy.averagePercent}%`}
            </strong>{' '}
            · {data.occupancy.samples} snapshot.
          </p>
          {data.occupancy.peakHours.length > 0 && (
            <div>
              <h4>Khung giờ lấp đầy cao</h4>
              <ul>
                {data.occupancy.peakHours.map((hour) => (
                  <li key={hour.hourUtc}>
                    {localHour(hour.hourUtc)} (giờ Việt Nam): {hour.averagePercent}% từ {hour.samples}{' '}
                    snapshot
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="small">
            Nguồn snapshot: mẫu {data.occupancy.sourceCounts.DEMO}, chủ quán{' '}
            {data.occupancy.sourceCounts.OPERATOR}, POS {data.occupancy.sourceCounts.POS}.
          </p>
          {(data.views.truncated || data.occupancy.truncated) && (
            <p className="small">Thống kê đã giới hạn số bản ghi.</p>
          )}
        </>
      )}
    </section>
  );
}

function AvailabilityEditor({ venue }: { venue: BusinessVenue }) {
  const save = useManualAvailability();
  const [tablesTotal, setTablesTotal] = useState(0);
  const [tablesAvailable, setTablesAvailable] = useState(0);
  const [seatsTotal, setSeatsTotal] = useState(0);
  const [seatsAvailable, setSeatsAvailable] = useState(0);
  const [crowdLevel, setCrowdLevel] = useState<ManualAvailabilityInput['crowdLevel']>('MODERATE');
  const [estimatedWaitMinutes, setEstimatedWaitMinutes] = useState(0);
  const [acceptingGuests, setAcceptingGuests] = useState(true);
  const [saved, setSaved] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const input: ManualAvailabilityInput = {
      crowdLevel,
      estimatedWaitMinutes,
      acceptingGuests,
      seats: { total: seatsTotal, available: seatsAvailable },
      ...(venue.category === 'CINEMA' ? {} : { tables: { total: tablesTotal, available: tablesAvailable } }),
    };
    try {
      await save.mutateAsync({ slug: venue.slug, input });
      setSaved(true);
    } catch {
      /* Error is shown below. */
    }
  }
  return (
    <form className="card business-form" onSubmit={(event) => void submit(event)}>
      <h3>Cập nhật chỗ trống · {venue.name}</h3>
      <p>Số liệu thủ công tự hết hạn sau 10 phút.</p>
      {venue.category !== 'CINEMA' && (
        <>
          <label>
            Tổng số bàn
            <input
              type="number"
              min="0"
              value={tablesTotal}
              onChange={(event) => setTablesTotal(Number(event.target.value))}
              required
            />
          </label>
          <label>
            Bàn còn trống
            <input
              type="number"
              min="0"
              max={tablesTotal}
              value={tablesAvailable}
              onChange={(event) => setTablesAvailable(Number(event.target.value))}
              required
            />
          </label>
        </>
      )}
      <label>
        Tổng số ghế
        <input
          type="number"
          min="0"
          value={seatsTotal}
          onChange={(event) => setSeatsTotal(Number(event.target.value))}
          required
        />
      </label>
      <label>
        Ghế còn trống
        <input
          type="number"
          min="0"
          max={seatsTotal}
          value={seatsAvailable}
          onChange={(event) => setSeatsAvailable(Number(event.target.value))}
          required
        />
      </label>
      <label>
        Mức độ đông
        <select
          value={crowdLevel}
          onChange={(event) => setCrowdLevel(event.target.value as ManualAvailabilityInput['crowdLevel'])}
        >
          <option value="QUIET">Vắng</option>
          <option value="MODERATE">Vừa</option>
          <option value="BUSY">Đông</option>
          <option value="FULL">Đầy</option>
        </select>
      </label>
      <label>
        Thời gian chờ (phút)
        <input
          type="number"
          min="0"
          max="240"
          value={estimatedWaitMinutes}
          onChange={(event) => setEstimatedWaitMinutes(Number(event.target.value))}
          required
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={acceptingGuests}
          onChange={(event) => setAcceptingGuests(event.target.checked)}
        />{' '}
        Đang nhận khách
      </label>
      <button className="primary" disabled={save.isPending}>
        {save.isPending ? 'Đang lưu…' : 'Cập nhật chỗ trống'}
      </button>
      {save.isError && <p role="alert">{save.error.message}</p>}
      {saved && <p role="status">Đã cập nhật; nguồn hiển thị là chủ quán.</p>}
    </form>
  );
}

function ProfileEditor({ venue, userId }: { venue: BusinessVenue; userId: string }) {
  const save = useUpdateBusinessProfile(userId);
  const upload = useUploadBusinessLogo(userId);
  const uploadCover = useUploadBusinessCover(userId);
  const [logo, setLogo] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [form, setForm] = useState<BusinessProfileInput>({
    name: venue.name,
    address: venue.address,
    description: venue.description,
    openingHours: venue.openingHours,
    menuSummary: venue.menuSummary,
    priceTier: venue.priceTier,
  });
  const [saved, setSaved] = useState(false);
  const patch = (next: Partial<BusinessProfileInput>) => {
    setForm((current) => ({ ...current, ...next }));
    setSaved(false);
  };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await save.mutateAsync({ slug: venue.slug, input: form });
      setSaved(true);
    } catch {
      /* Error is shown below. */
    }
  }
  return (
    <form className="card business-form" onSubmit={(event) => void submit(event)}>
      <h2>
        {venue.name} {venue.verified && <span aria-label="Đã xác thực">✓</span>}
      </h2>
      <p>Gói doanh nghiệp: {venue.plan === 'PREMIUM' ? 'Premium' : 'Cơ bản'}</p>
      <label>
        Tên quán
        <input
          value={form.name}
          onChange={(event) => patch({ name: event.target.value })}
          minLength={3}
          maxLength={100}
          required
        />
      </label>
      <label>
        Địa chỉ
        <input
          value={form.address}
          onChange={(event) => patch({ address: event.target.value })}
          minLength={5}
          maxLength={200}
          required
        />
      </label>
      <label>
        Mô tả
        <textarea
          value={form.description}
          onChange={(event) => patch({ description: event.target.value })}
          maxLength={500}
        />
      </label>
      <label>
        Giờ mở cửa
        <input
          value={form.openingHours}
          onChange={(event) => patch({ openingHours: event.target.value })}
          maxLength={200}
          placeholder="08:00–22:00 hằng ngày"
        />
      </label>
      <label>
        Menu tóm tắt
        <textarea
          value={form.menuSummary}
          onChange={(event) => patch({ menuSummary: event.target.value })}
          maxLength={1000}
        />
      </label>
      <label>
        Mức giá
        <select value={form.priceTier} onChange={(event) => patch({ priceTier: Number(event.target.value) })}>
          {[1, 2, 3, 4].map((tier) => (
            <option key={tier} value={tier}>
              {'₫'.repeat(tier)}
            </option>
          ))}
        </select>
      </label>
      <button className="primary" disabled={save.isPending}>
        {save.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}
      </button>
      {save.isError && <p role="alert">{save.error.message}</p>}
      {saved && <p role="status">Đã cập nhật hồ sơ công khai.</p>}
      <label>
        Logo (JPEG, PNG, WebP; tối đa 2 MB)
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setLogo(event.target.files?.[0] ?? null)}
        />
      </label>
      <button
        type="button"
        disabled={!logo || logo.size > 2_000_000 || upload.isPending}
        onClick={() =>
          logo && upload.mutate({ slug: venue.slug, file: logo }, { onSuccess: () => setLogo(null) })
        }
      >
        {upload.isPending ? 'Đang tải…' : 'Cập nhật logo'}
      </button>
      {logo && logo.size > 2_000_000 && <p role="alert">Logo vượt quá 2 MB.</p>}
      {upload.isError && <p role="alert">{upload.error.message}</p>}
      {venue.logoUrl && (
        <img className="business-logo-preview" src={venue.logoUrl} alt={`Logo ${venue.name}`} />
      )}
      {venue.plan === 'PREMIUM' && (
        <>
          <label>
            Ảnh bìa (JPEG, PNG, WebP; tối đa 2 MB)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setCover(event.target.files?.[0] ?? null)}
            />
          </label>
          <button
            type="button"
            disabled={!cover || cover.size > 2_000_000 || uploadCover.isPending}
            onClick={() =>
              cover &&
              uploadCover.mutate({ slug: venue.slug, file: cover }, { onSuccess: () => setCover(null) })
            }
          >
            {uploadCover.isPending ? 'Đang tải…' : 'Cập nhật ảnh bìa'}
          </button>
          {cover && cover.size > 2_000_000 && <p role="alert">Ảnh bìa vượt quá 2 MB.</p>}
          {uploadCover.isError && <p role="alert">{uploadCover.error.message}</p>}
          {venue.coverUrl && (
            <img className="business-cover-preview" src={venue.coverUrl} alt={`Ảnh bìa ${venue.name}`} />
          )}
        </>
      )}
    </form>
  );
}

export function BusinessPage() {
  const [params] = useSearchParams();
  const auth = useCurrentUser();
  const userId = auth.data?.id ?? null;
  const claims = useBusinessClaims(userId);
  const venues = useBusinessVenues(userId);
  const request = useRequestBusinessClaim(userId);
  const [slug, setSlug] = useState(params.get('slug') ?? '');
  const [evidence, setEvidence] = useState('');
  const [sent, setSent] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    try {
      await request.mutateAsync({ slug: slug.trim(), evidence: evidence.trim() });
      setSent(true);
      setEvidence('');
    } catch {
      /* Error is shown below. */
    }
  }
  return (
    <main className="plans-page business-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <h1>Dành cho chủ quán</h1>
      <p>Gửi yêu cầu quản lý địa điểm. Người vận hành sẽ kiểm tra trước khi cấp quyền chỉnh sửa.</p>
      {auth.isPending && <p>Đang kiểm tra đăng nhập…</p>}
      {!auth.isPending && !userId && (
        <p>
          <AuthLink>Đăng nhập</AuthLink> để gửi yêu cầu.
        </p>
      )}
      {userId && (
        <>
          <form className="card business-form" onSubmit={(event) => void submit(event)}>
            <h2>Yêu cầu quản lý quán</h2>
            <label>
              Slug địa điểm
              <input value={slug} onChange={(event) => setSlug(event.target.value)} required />
            </label>
            <label>
              Thông tin chứng minh quyền quản lý
              <textarea
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
                minLength={20}
                maxLength={300}
                required
                placeholder="Mô tả giấy tờ hoặc cách người vận hành có thể đối chiếu quyền quản lý"
              />
            </label>
            <button className="primary" disabled={request.isPending}>
              {request.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
            </button>
            {request.isError && <p role="alert">{request.error.message}</p>}
            {sent && <p role="status">Đã gửi yêu cầu, đang chờ duyệt.</p>}
          </form>
          <h2>Yêu cầu của tôi</h2>
          {claims.isPending && <p>Đang tải yêu cầu…</p>}
          {claims.isError && <p role="alert">{claims.error.message}</p>}
          {claims.data?.length === 0 && <p>Chưa có yêu cầu nào.</p>}
          {claims.data?.map((claim) => (
            <p key={claim.id}>
              {claim.venueSlug} ·{' '}
              {claim.status === 'PENDING'
                ? 'Chờ duyệt'
                : claim.status === 'APPROVED'
                  ? 'Đã duyệt'
                  : 'Từ chối'}
            </p>
          ))}
          <h2>Địa điểm đang quản lý</h2>
          {venues.isPending && <p>Đang tải địa điểm…</p>}
          {venues.isError && <p role="alert">{venues.error.message}</p>}
          {venues.data?.length === 0 && <p>Chưa có địa điểm được duyệt.</p>}
          {venues.data?.map((venue) => (
            <div key={venue.slug}>
              <ProfileEditor venue={venue} userId={userId} />
              {venue.category !== 'CINEMA' && (
                <BookingQueue slug={venue.slug} userId={userId} enabled={venue.bookingEnabled} />
              )}
              {venue.plan === 'PREMIUM' && (
                <>
                  <AvailabilityEditor venue={venue} />
                  <Dashboard venue={venue} userId={userId} />
                  <CampaignEditor venue={venue} userId={userId} />
                </>
              )}
            </div>
          ))}
        </>
      )}
    </main>
  );
}
