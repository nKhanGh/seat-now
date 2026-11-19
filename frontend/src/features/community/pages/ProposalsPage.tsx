import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useConfirmProposal, useCreateProposal, useProposals } from '../api/proposalsQueries';
import { ProposalInput } from '../services/proposals.service';

export function ProposalsPage() {
  const [params] = useSearchParams();
  const auth = useCurrentUser();
  const proposals = useProposals();
  const create = useCreateProposal();
  const confirm = useConfirmProposal();
  const [form, setForm] = useState<ProposalInput>({
    name: '', category: 'RESTAURANT', cuisineTypes: [], description: '', address: '',
    lat: params.get('lat') === null ? 10.7769 : Number(params.get('lat')),
    lng: params.get('lng') === null ? 106.7009 : Number(params.get('lng')),
    priceTier: 2,
  });
  const [message, setMessage] = useState('');

  function patch(next: Partial<ProposalInput>) { setForm((current) => ({ ...current, ...next })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage('');
    try { await create.mutateAsync(form); setMessage('Đã gửi đề xuất. Quán sẽ lên bản đồ sau khi cộng đồng xác nhận và được duyệt.');
      patch({ name: '', description: '', address: '' }); }
    catch { /* Mutation error is rendered below. */ }
  }

  return <main className="plans-page proposals-page">
    <Link to="/" className="brand">SeatNow</Link><h1>Đề xuất địa điểm</h1>
    <p>Địa điểm mới cần ba người khác xác nhận và được duyệt trước khi xuất hiện trên bản đồ.</p>
    {auth.data ? <form className="card proposal-form" onSubmit={(event) => void submit(event)}>
      <h2>Thêm địa điểm</h2>
      <label>Tên địa điểm<input value={form.name} onChange={(event) => patch({ name: event.target.value })} minLength={3} maxLength={100} required /></label>
      <label>Loại địa điểm<select value={form.category} onChange={(event) => patch({ category: event.target.value as ProposalInput['category'] })}>
        <option value="RESTAURANT">Nhà hàng</option><option value="CAFE">Cà phê</option><option value="CINEMA">Rạp phim</option>
      </select></label>
      <label>Loại món<select value={form.cuisineTypes[0] ?? ''} onChange={(event) => patch({ cuisineTypes: event.target.value ? [event.target.value] : [] })}>
        <option value="">Không áp dụng</option><option value="VIETNAMESE">Món Việt</option><option value="WESTERN">Món Âu</option><option value="COFFEE">Cà phê</option><option value="DESSERT">Tráng miệng</option>
      </select></label>
      <label>Địa chỉ<input value={form.address} onChange={(event) => patch({ address: event.target.value })} minLength={5} maxLength={200} required /></label>
      <label>Mô tả<textarea value={form.description} onChange={(event) => patch({ description: event.target.value })} minLength={10} maxLength={500} required /></label>
      <div className="proposal-coordinates"><label>Vĩ độ<input type="number" step="any" min="-90" max="90" value={form.lat} onChange={(event) => patch({ lat: Number(event.target.value) })} required /></label>
        <label>Kinh độ<input type="number" step="any" min="-180" max="180" value={form.lng} onChange={(event) => patch({ lng: Number(event.target.value) })} required /></label></div>
      <label>Mức giá<select value={form.priceTier} onChange={(event) => patch({ priceTier: Number(event.target.value) })}>
        {[1, 2, 3, 4].map((tier) => <option key={tier} value={tier}>{'₫'.repeat(tier)}</option>)}
      </select></label>
      <button className="primary" disabled={create.isPending}>{create.isPending ? 'Đang gửi…' : 'Gửi đề xuất'}</button>
      {create.isError && <p role="alert">{create.error.message}</p>}{message && <p role="status">{message}</p>}
    </form> : <p><Link to="/login">Đăng nhập</Link> để đề xuất địa điểm mới.</p>}
    <h2>Đang chờ xác nhận</h2>
    {proposals.isPending && <p>Đang tải đề xuất…</p>}
    {proposals.isError && <p role="alert">{proposals.error.message} <button onClick={() => void proposals.refetch()}>Thử lại</button></p>}
    {proposals.data?.length === 0 && <p>Chưa có đề xuất nào.</p>}
    {proposals.data?.map((proposal) => <article key={proposal.id} className="card proposal-card">
      <h3>{proposal.name}</h3><p>{proposal.address}</p><p>{proposal.description}</p>
      <p>{proposal.confirmationCount}/{proposal.confirmationsRequired} lượt xác nhận · {proposal.status === 'READY_FOR_REVIEW' ? 'Đang chờ duyệt' : 'Đang chờ cộng đồng'}</p>
      {auth.data && proposal.status === 'PENDING' && <button disabled={confirm.isPending} onClick={() => confirm.mutate(proposal.id)}>Xác nhận địa điểm này</button>}
    </article>)}
    {confirm.isError && <p role="alert">{confirm.error.message}</p>}
  </main>;
}
