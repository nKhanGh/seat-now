import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { AuthLink } from '../../auth/components/AuthLink';
import { useDecideBusinessClaim, usePendingBusinessClaims, useReadyProposals } from '../api/adminQueries';
import { AdminProposalsPanel } from '../components/AdminProposalsPanel';
import { AdminPremiumPanel } from '../components/AdminPremiumPanel';
import { AdminVouchersPanel } from '../components/AdminVouchersPanel';

type Decision = { id: string; action: 'approve' | 'reject' };

export function AdminPage() {
  const auth = useCurrentUser();
  const isAdmin = auth.data?.role === 'ADMIN';
  const claims = usePendingBusinessClaims(isAdmin);
  const proposals = useReadyProposals(isAdmin);
  const decide = useDecideBusinessClaim();
  const [tab, setTab] = useState<'claims' | 'proposals' | 'premium' | 'vouchers'>('claims');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [notice, setNotice] = useState('');

  async function confirm() {
    if (!decision) return;
    setNotice('');
    try {
      await decide.mutateAsync(decision);
      setNotice(decision.action === 'approve' ? 'Đã duyệt yêu cầu.' : 'Đã từ chối yêu cầu.');
      setDecision(null);
    } catch {
      /* The mutation error is displayed below. */
    }
  }

  return (
    <main className="plans-page admin-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Khu vực quản trị</p>
          <h1>Xét duyệt</h1>
          <p>Kiểm tra yêu cầu quản lý quán và đề xuất địa điểm từ cộng đồng.</p>
        </div>
        <Link to="/" className="admin-back">
          Về bản đồ
        </Link>
      </div>
      {auth.isPending && <p>Đang kiểm tra quyền truy cập…</p>}
      {!auth.isPending && !auth.data && (
        <p>
          <AuthLink>Đăng nhập</AuthLink> bằng tài khoản admin để xét duyệt.
        </p>
      )}
      {!auth.isPending && auth.data && !isAdmin && (
        <p role="alert" className="error">
          Tài khoản này không có quyền xét duyệt.
        </p>
      )}
      {isAdmin && (
        <>
          <div className="admin-tabs" role="tablist" aria-label="Loại yêu cầu">
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'claims'}
              onClick={() => setTab('claims')}
            >
              Chủ quán ({claims.data?.length ?? 0})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'proposals'}
              onClick={() => setTab('proposals')}
            >
              Quán cộng đồng ({proposals.data?.data.length ?? 0})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'premium'}
              onClick={() => setTab('premium')}
            >
              Premium demo
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'vouchers'}
              onClick={() => setTab('vouchers')}
            >
              Voucher
            </button>
          </div>
          {tab === 'vouchers' ? (
            <AdminVouchersPanel />
          ) : tab === 'premium' ? (
            <AdminPremiumPanel />
          ) : tab === 'proposals' ? (
            <AdminProposalsPanel queue={proposals} />
          ) : (
            <section aria-label="Xét duyệt chủ quán">
              <div className="admin-toolbar">
                <strong>{claims.data?.length ?? 0} yêu cầu đang chờ</strong>
                <button type="button" onClick={() => void claims.refetch()} disabled={claims.isFetching}>
                  {claims.isFetching ? 'Đang tải…' : 'Làm mới'}
                </button>
              </div>
              {notice && (
                <p role="status" className="notice">
                  {notice}
                </p>
              )}
              {claims.isPending && <p>Đang tải yêu cầu…</p>}
              {claims.isError && (
                <p role="alert" className="error">
                  {claims.error.message}
                </p>
              )}
              {claims.data?.length === 0 && <p>Không có yêu cầu nào đang chờ.</p>}
              <div className="admin-claim-list">
                {claims.data?.map((claim) => (
                  <article className="admin-claim" key={claim.id}>
                    <div className="admin-claim-title">
                      <div>
                        <span className="eyebrow">Yêu cầu quản lý</span>
                        <h2>{claim.venueName}</h2>
                        <small>{claim.venueSlug}</small>
                      </div>
                      <time dateTime={claim.createdAt}>
                        {new Date(claim.createdAt).toLocaleString('vi-VN')}
                      </time>
                    </div>
                    <p>
                      <strong>Người gửi:</strong> {claim.applicant?.displayName ?? claim.userId}
                    </p>
                    {claim.applicant && (
                      <p>
                        <strong>Email:</strong> {claim.applicant.email}
                      </p>
                    )}
                    <p>
                      <strong>Thông tin chứng minh:</strong>
                    </p>
                    <p className="admin-evidence">{claim.evidence}</p>
                    {claim.hasDocument && (
                      <div className="admin-document">
                        <strong>Ảnh chứng minh</strong>
                        <img
                          src={`/api/v1/admin/business/claims/${encodeURIComponent(claim.id)}/document`}
                          alt={`Ảnh chứng minh cho yêu cầu ${claim.venueSlug}`}
                        />
                      </div>
                    )}
                    {decision?.id === claim.id ? (
                      <div className="admin-decision" role="group" aria-label="Xác nhận quyết định">
                        <p>
                          {decision.action === 'approve'
                            ? 'Cấp quyền quản lý quán này cho tài khoản trên?'
                            : 'Từ chối yêu cầu quản lý quán này?'}
                        </p>
                        <div className="admin-actions">
                          <button type="button" onClick={() => setDecision(null)} disabled={decide.isPending}>
                            Hủy
                          </button>
                          <button
                            type="button"
                            className="primary"
                            onClick={() => void confirm()}
                            disabled={decide.isPending}
                          >
                            {decide.isPending ? 'Đang xử lý…' : 'Xác nhận'}
                          </button>
                        </div>
                        {decide.isError && (
                          <p role="alert" className="error">
                            {decide.error.message}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="admin-actions">
                        <button
                          type="button"
                          className="admin-approve"
                          onClick={() => {
                            decide.reset();
                            setDecision({ id: claim.id, action: 'approve' });
                          }}
                        >
                          Duyệt
                        </button>
                        <button
                          type="button"
                          className="admin-reject"
                          onClick={() => {
                            decide.reset();
                            setDecision({ id: claim.id, action: 'reject' });
                          }}
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
