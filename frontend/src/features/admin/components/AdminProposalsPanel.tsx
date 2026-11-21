import { useState } from 'react';
import { useDecideProposal, useReadyProposals } from '../api/adminQueries';
import { priceTierLabel } from '../../../shared/priceTier';

type Decision = { id: string; action: 'approve' | 'reject' };

const categoryLabels = { RESTAURANT: 'Nhà hàng', CAFE: 'Cà phê', CINEMA: 'Rạp chiếu phim' };

export function AdminProposalsPanel({ queue }: { queue: ReturnType<typeof useReadyProposals> }) {
  const decide = useDecideProposal();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [notice, setNotice] = useState('');

  async function confirm() {
    if (!decision) return;
    setNotice('');
    try {
      await decide.mutateAsync(decision);
      setNotice(decision.action === 'approve' ? 'Đã đưa quán lên bản đồ.' : 'Đã từ chối đề xuất.');
      setDecision(null);
    } catch {
      // The mutation error is shown next to the confirmation buttons.
    }
  }

  return (
    <section aria-label="Xét duyệt quán cộng đồng">
      <div className="admin-toolbar">
        <strong>{queue.data?.data.length ?? 0} đề xuất đủ lượt xác nhận</strong>
        <button type="button" onClick={() => void queue.refetch()} disabled={queue.isFetching}>
          {queue.isFetching ? 'Đang tải…' : 'Làm mới'}
        </button>
      </div>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {queue.isPending && <p>Đang tải đề xuất…</p>}
      {queue.isError && (
        <p role="alert" className="error">
          {queue.error.message}
        </p>
      )}
      {queue.data?.data.length === 0 && <p>Chưa có đề xuất nào đủ ba lượt xác nhận để xét duyệt.</p>}
      {queue.data?.meta.truncated && (
        <p className="notice">Đang hiển thị 100 đề xuất cũ nhất. Xử lý bớt để xem tiếp.</p>
      )}
      <div className="admin-claim-list">
        {queue.data?.data.map((proposal) => (
          <article className="admin-claim" key={proposal.id}>
            <div className="admin-claim-title">
              <div>
                <span className="eyebrow">{categoryLabels[proposal.category]}</span>
                <h2>{proposal.name}</h2>
                <small>
                  {proposal.confirmationCount}/{proposal.confirmationsRequired} lượt xác nhận
                </small>
              </div>
              <time dateTime={proposal.createdAt}>
                {new Date(proposal.createdAt).toLocaleString('vi-VN')}
              </time>
            </div>
            <p>
              <strong>Địa chỉ:</strong> {proposal.address}
            </p>
            <p>
              <strong>Người đề xuất:</strong>{' '}
              {proposal.applicant?.displayName ?? 'Tài khoản không còn tồn tại'}
            </p>
            {proposal.applicant && (
              <p>
                <strong>Email:</strong> {proposal.applicant.email}
              </p>
            )}
            <p>
              <strong>Loại món:</strong> {proposal.cuisineTypes.join(', ') || 'Chưa khai báo'}
            </p>
            <p>
              <strong>Mức giá:</strong> {priceTierLabel(proposal.priceTier)}
            </p>
            <p>
              <strong>Mô tả:</strong>
            </p>
            <p className="admin-evidence">{proposal.description}</p>
            <a
              className="admin-location-link"
              href={`https://www.google.com/maps?q=${encodeURIComponent(`${proposal.lat},${proposal.lng}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Kiểm tra vị trí ({proposal.lat.toFixed(5)}, {proposal.lng.toFixed(5)})
            </a>
            {decision?.id === proposal.id ? (
              <div className="admin-decision" role="group" aria-label="Xác nhận quyết định">
                <p>
                  {decision.action === 'approve'
                    ? 'Đăng quán này lên bản đồ với thông tin trên?'
                    : 'Từ chối đề xuất quán này?'}
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
                    setDecision({ id: proposal.id, action: 'approve' });
                  }}
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  className="admin-reject"
                  onClick={() => {
                    decide.reset();
                    setDecision({ id: proposal.id, action: 'reject' });
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
  );
}
