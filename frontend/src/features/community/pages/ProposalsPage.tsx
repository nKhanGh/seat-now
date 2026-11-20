import { FormEvent, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCurrentUser } from '../../auth/api/authQueries';
import { useConfirmProposal, useCreateProposal, useMyProposals, useProposals } from '../api/proposalsQueries';
import { ProposalInput } from '../services/proposals.service';
import { ProposalLocationPicker } from '../components/ProposalLocationPicker';

function initialCoordinate(value: string | null, fallback: number, min: number, max: number) {
  const coordinate = value === null ? fallback : Number(value);
  return Number.isFinite(coordinate) && coordinate >= min && coordinate <= max ? coordinate : fallback;
}

export function ProposalsPage() {
  const [params] = useSearchParams();
  const auth = useCurrentUser();
  const proposals = useProposals();
  const mine = useMyProposals(auth.data?.id ?? null);
  const create = useCreateProposal();
  const confirm = useConfirmProposal();
  const [form, setForm] = useState<ProposalInput>({
    name: '',
    category: 'RESTAURANT',
    cuisineTypes: [],
    description: '',
    address: '',
    lat: initialCoordinate(params.get('lat'), 10.7769, -90, 90),
    lng: initialCoordinate(params.get('lng'), 106.7009, -180, 180),
    priceTier: 2,
  });
  const [message, setMessage] = useState('');
  const [locationMessage, setLocationMessage] = useState('');

  function patch(next: Partial<ProposalInput>) {
    setForm((current) => ({ ...current, ...next }));
  }
  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationMessage('Trình duyệt không hỗ trợ vị trí.');
      return;
    }
    setLocationMessage('Đang lấy vị trí…');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        patch({ lat: Number(coords.latitude.toFixed(6)), lng: Number(coords.longitude.toFixed(6)) });
        setLocationMessage(
          `Đã đặt ghim theo vị trí của bạn (độ chính xác khoảng ${Math.round(coords.accuracy)} m).`,
        );
      },
      () => setLocationMessage('Không lấy được vị trí. Bạn có thể bấm bản đồ hoặc nhập tọa độ.'),
      { timeout: 8000 },
    );
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    try {
      await create.mutateAsync(form);
      setMessage('Đã gửi đề xuất. Quán sẽ lên bản đồ sau khi cộng đồng xác nhận và được duyệt.');
      patch({ name: '', description: '', address: '' });
    } catch {
      /* Mutation error is rendered below. */
    }
  }

  return (
    <main className="plans-page proposals-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <h1>Đề xuất địa điểm</h1>
      <p>Địa điểm mới cần ba người khác xác nhận và được duyệt trước khi xuất hiện trên bản đồ.</p>
      <p>
        Muốn quản lý một quán đã có trên bản đồ? <Link to="/business">Gửi yêu cầu xác minh chủ quán</Link>.
      </p>
      {auth.data ? (
        <form className="card proposal-form" onSubmit={(event) => void submit(event)}>
          <h2>Thêm địa điểm</h2>
          <label>
            Tên địa điểm
            <input
              value={form.name}
              onChange={(event) => patch({ name: event.target.value })}
              minLength={3}
              maxLength={100}
              required
            />
          </label>
          <label>
            Loại địa điểm
            <select
              value={form.category}
              onChange={(event) => patch({ category: event.target.value as ProposalInput['category'] })}
            >
              <option value="RESTAURANT">Nhà hàng</option>
              <option value="CAFE">Cà phê</option>
              <option value="CINEMA">Rạp phim</option>
            </select>
          </label>
          <label>
            Loại món
            <select
              value={form.cuisineTypes[0] ?? ''}
              onChange={(event) => patch({ cuisineTypes: event.target.value ? [event.target.value] : [] })}
            >
              <option value="">Không áp dụng</option>
              <option value="VIETNAMESE">Món Việt</option>
              <option value="WESTERN">Món Âu</option>
              <option value="COFFEE">Cà phê</option>
              <option value="DESSERT">Tráng miệng</option>
            </select>
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
              minLength={10}
              maxLength={500}
              required
            />
          </label>
          <button type="button" className="proposal-locate" onClick={useMyLocation}>
            Dùng vị trí của tôi
          </button>
          {locationMessage && (
            <p role="status" className="small">
              {locationMessage}
            </p>
          )}
          <ProposalLocationPicker
            lat={form.lat}
            lng={form.lng}
            onChange={(lat, lng) => patch({ lat, lng })}
          />
          <div className="proposal-coordinates">
            <label>
              Vĩ độ
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={form.lat}
                onChange={(event) => patch({ lat: Number(event.target.value) })}
                required
              />
            </label>
            <label>
              Kinh độ
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={form.lng}
                onChange={(event) => patch({ lng: Number(event.target.value) })}
                required
              />
            </label>
          </div>
          <label>
            Mức giá
            <select
              value={form.priceTier}
              onChange={(event) => patch({ priceTier: Number(event.target.value) })}
            >
              {[1, 2, 3, 4].map((tier) => (
                <option key={tier} value={tier}>
                  {'₫'.repeat(tier)}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" disabled={create.isPending}>
            {create.isPending ? 'Đang gửi…' : 'Gửi đề xuất'}
          </button>
          {create.isError && <p role="alert">{create.error.message}</p>}
          {message && <p role="status">{message}</p>}
        </form>
      ) : (
        <p>
          <Link to="/login">Đăng nhập</Link> để đề xuất địa điểm mới.
        </p>
      )}
      {auth.data && (
        <section aria-label="Đề xuất của tôi">
          <h2>Đề xuất của tôi</h2>
          {mine.isPending && <p>Đang tải tiến độ…</p>}
          {mine.isError && <p role="alert">{mine.error.message}</p>}
          {mine.data?.length === 0 && <p>Bạn chưa gửi đề xuất nào.</p>}
          {mine.data?.map((proposal) => (
            <article key={proposal.id} className="card proposal-card">
              <h3>{proposal.name}</h3>
              <p>
                {proposal.status === 'PENDING'
                  ? `Chờ cộng đồng xác nhận (${proposal.confirmationCount}/3)`
                  : proposal.status === 'READY_FOR_REVIEW'
                    ? 'Đủ xác nhận, chờ người vận hành duyệt'
                    : proposal.status === 'APPROVED'
                      ? 'Đã duyệt và lên bản đồ'
                      : 'Đã bị từ chối'}
              </p>
              {proposal.status === 'APPROVED' && (
                <Link
                  to={`/?venue=${encodeURIComponent(proposal.slug)}&lat=${proposal.lat}&lng=${proposal.lng}`}
                >
                  Xem trên bản đồ
                </Link>
              )}
            </article>
          ))}
        </section>
      )}
      <h2>Đang chờ xác nhận</h2>
      {proposals.isPending && <p>Đang tải đề xuất…</p>}
      {proposals.isError && (
        <p role="alert">
          {proposals.error.message} <button onClick={() => void proposals.refetch()}>Thử lại</button>
        </p>
      )}
      {proposals.data?.length === 0 && <p>Chưa có đề xuất nào.</p>}
      {proposals.data?.map((proposal) => (
        <article key={proposal.id} className="card proposal-card">
          <h3>{proposal.name}</h3>
          <p>{proposal.address}</p>
          <p>{proposal.description}</p>
          <p>
            {proposal.confirmationCount}/{proposal.confirmationsRequired} lượt xác nhận ·{' '}
            {proposal.status === 'READY_FOR_REVIEW' ? 'Đang chờ duyệt' : 'Đang chờ cộng đồng'}
          </p>
          {auth.data && proposal.status === 'PENDING' && (
            <button disabled={confirm.isPending} onClick={() => confirm.mutate(proposal.id)}>
              Xác nhận địa điểm này
            </button>
          )}
        </article>
      ))}
      {confirm.isError && <p role="alert">{confirm.error.message}</p>}
    </main>
  );
}
