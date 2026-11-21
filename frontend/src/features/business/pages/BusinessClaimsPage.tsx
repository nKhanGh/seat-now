import { FormEvent, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useBusinessClaims, useRequestBusinessClaim } from '../api/businessQueries';
import { useBusinessContext } from './BusinessPage';

export function BusinessClaimsPage() {
  const [params] = useSearchParams();
  const { userId, venues } = useBusinessContext();
  const claims = useBusinessClaims(userId);
  const request = useRequestBusinessClaim(userId);
  const requestedSlug = params.get('slug') ?? '';
  const [slug, setSlug] = useState(requestedSlug);
  const [evidence, setEvidence] = useState('');
  const [document, setDocument] = useState<File | null>(null);
  const documentInput = useRef<HTMLInputElement | null>(null);
  const [documentError, setDocumentError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => setSlug(requestedSlug), [requestedSlug]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);
    setDocumentError('');
    if (
      document &&
      (document.size > 3_000_000 || !['image/jpeg', 'image/png', 'image/webp'].includes(document.type))
    ) {
      setDocumentError('Chọn ảnh JPEG, PNG hoặc WebP tối đa 3 MB.');
      return;
    }
    try {
      await request.mutateAsync({ slug: slug.trim(), evidence: evidence.trim(), document });
      setSent(true);
      setEvidence('');
      setDocument(null);
      if (documentInput.current) documentInput.current.value = '';
    } catch {
      // The mutation error is shown under the form.
    }
  }

  return (
    <section className="business-claims-page" aria-label="Yêu cầu quyền quản lý quán">
      <h2>Yêu cầu quyền quản lý</h2>
      <p>Quán cần có trên bản đồ. Admin kiểm tra bằng chứng trước khi cấp quyền chỉnh sửa.</p>
      <h3>Yêu cầu của tôi</h3>
      {claims.isPending && <p>Đang tải yêu cầu…</p>}
      {claims.isError && <p role="alert">{claims.error.message}</p>}
      {claims.data?.length === 0 && <p>Bạn chưa gửi yêu cầu nào.</p>}
      <div className="business-claim-list">
        {claims.data?.map((claim) => (
          <article key={claim.id} className="card business-claim-card">
            <strong>
              {venues.data?.find((venue) => venue.slug === claim.venueSlug)?.name ?? claim.venueSlug}
            </strong>
            <span>
              {claim.status === 'PENDING'
                ? 'Chờ duyệt'
                : claim.status === 'APPROVED'
                  ? 'Đã duyệt'
                  : 'Từ chối'}
              {claim.hasDocument && ' · Có ảnh chứng minh'}
            </span>
            {claim.status === 'APPROVED' && venues.data?.some((venue) => venue.slug === claim.venueSlug) && (
              <Link to={`/business/venues/${encodeURIComponent(claim.venueSlug)}/profile`}>
                Mở trang quản lý
              </Link>
            )}
          </article>
        ))}
      </div>
      <form className="card business-form" onSubmit={(event) => void submit(event)}>
        <h3>Gửi yêu cầu mới</h3>
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
        <label>
          Ảnh giấy tờ hoặc hình chứng minh (nếu có)
          <input
            ref={documentInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => setDocument(event.target.files?.[0] ?? null)}
          />
        </label>
        <p className="small">JPEG, PNG hoặc WebP, tối đa 3 MB. Ảnh chỉ dành cho admin xét duyệt.</p>
        {document && <p className="small">Đã chọn: {document.name}</p>}
        {documentError && (
          <p role="alert" className="error">
            {documentError}
          </p>
        )}
        <button className="primary" disabled={request.isPending}>
          {request.isPending ? 'Đang gửi…' : 'Gửi yêu cầu'}
        </button>
        {request.isError && <p role="alert">{request.error.message}</p>}
        {sent && <p role="status">Đã gửi yêu cầu, đang chờ duyệt.</p>}
      </form>
    </section>
  );
}
