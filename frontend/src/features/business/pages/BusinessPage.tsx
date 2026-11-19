import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useBusinessClaims, useBusinessVenues, useRequestBusinessClaim, useUpdateBusinessProfile } from '../api/businessQueries';
import { BusinessProfileInput, BusinessVenue } from '../services/business.service';

function ProfileEditor({ venue, userId }: { venue: BusinessVenue; userId: string }) {
  const save = useUpdateBusinessProfile(userId);
  const [form, setForm] = useState<BusinessProfileInput>({
    name: venue.name, address: venue.address, description: venue.description,
    openingHours: venue.openingHours, menuSummary: venue.menuSummary, priceTier: venue.priceTier,
  });
  const [saved, setSaved] = useState(false);
  const patch = (next: Partial<BusinessProfileInput>) => { setForm((current) => ({ ...current, ...next })); setSaved(false); };
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { await save.mutateAsync({ slug: venue.slug, input: form }); setSaved(true); }
    catch { /* Error is shown below. */ }
  }
  return <form className="card business-form" onSubmit={(event) => void submit(event)}>
    <h2>{venue.name} {venue.verified && <span aria-label="Đã xác thực">✓</span>}</h2>
    <p>Gói doanh nghiệp: {venue.plan === 'PREMIUM' ? 'Premium' : 'Cơ bản'}</p>
    <label>Tên quán<input value={form.name} onChange={(event) => patch({ name: event.target.value })} minLength={3} maxLength={100} required /></label>
    <label>Địa chỉ<input value={form.address} onChange={(event) => patch({ address: event.target.value })} minLength={5} maxLength={200} required /></label>
    <label>Mô tả<textarea value={form.description} onChange={(event) => patch({ description: event.target.value })} maxLength={500} /></label>
    <label>Giờ mở cửa<input value={form.openingHours} onChange={(event) => patch({ openingHours: event.target.value })} maxLength={200} placeholder="08:00–22:00 hằng ngày" /></label>
    <label>Menu tóm tắt<textarea value={form.menuSummary} onChange={(event) => patch({ menuSummary: event.target.value })} maxLength={1000} /></label>
    <label>Mức giá<select value={form.priceTier} onChange={(event) => patch({ priceTier: Number(event.target.value) })}>
      {[1, 2, 3, 4].map((tier) => <option key={tier} value={tier}>{'₫'.repeat(tier)}</option>)}
    </select></label>
    <button className="primary" disabled={save.isPending}>{save.isPending ? 'Đang lưu…' : 'Lưu hồ sơ'}</button>
    {save.isError && <p role="alert">{save.error.message}</p>}
    {saved && <p role="status">Đã cập nhật hồ sơ công khai.</p>}
  </form>;
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
    event.preventDefault(); setSent(false);
    try { await request.mutateAsync({ slug: slug.trim(), evidence: evidence.trim() }); setSent(true); setEvidence(''); }
    catch { /* Error is shown below. */ }
  }
  return <main className="plans-page business-page">
    <Link to="/" className="brand">SeatNow</Link><h1>Dành cho chủ quán</h1>
    <p>Gửi yêu cầu quản lý địa điểm. Người vận hành sẽ kiểm tra trước khi cấp quyền chỉnh sửa.</p>
    {auth.isPending && <p>Đang kiểm tra đăng nhập…</p>}
    {!auth.isPending && !userId && <p><Link to="/login">Đăng nhập</Link> để gửi yêu cầu.</p>}
    {userId && <>
      <form className="card business-form" onSubmit={(event) => void submit(event)}>
        <h2>Yêu cầu quản lý quán</h2>
        <label>Slug địa điểm<input value={slug} onChange={(event) => setSlug(event.target.value)} required /></label>
        <label>Thông tin chứng minh quyền quản lý<textarea value={evidence} onChange={(event) => setEvidence(event.target.value)} minLength={20} maxLength={300} required placeholder="Mô tả giấy tờ hoặc cách người vận hành có thể đối chiếu quyền quản lý" /></label>
        <button className="primary" disabled={request.isPending}>{request.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}</button>
        {request.isError && <p role="alert">{request.error.message}</p>}{sent && <p role="status">Đã gửi yêu cầu, đang chờ duyệt.</p>}
      </form>
      <h2>Yêu cầu của tôi</h2>
      {claims.isPending && <p>Đang tải yêu cầu…</p>}{claims.isError && <p role="alert">{claims.error.message}</p>}
      {claims.data?.length === 0 && <p>Chưa có yêu cầu nào.</p>}
      {claims.data?.map((claim) => <p key={claim.id}>{claim.venueSlug} · {claim.status === 'PENDING' ? 'Chờ duyệt' : claim.status === 'APPROVED' ? 'Đã duyệt' : 'Từ chối'}</p>)}
      <h2>Địa điểm đang quản lý</h2>
      {venues.isPending && <p>Đang tải địa điểm…</p>}{venues.isError && <p role="alert">{venues.error.message}</p>}
      {venues.data?.length === 0 && <p>Chưa có địa điểm được duyệt.</p>}
      {venues.data?.map((venue) => <ProfileEditor key={venue.slug} venue={venue} userId={userId} />)}
    </>}
  </main>;
}
