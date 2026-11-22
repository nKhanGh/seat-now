import { FormEvent, useState } from 'react';
import { useAdminUsers, useSetDemoPremium } from '../api/adminQueries';
import type { AdminUser } from '../services/admin.service';

export function AdminPremiumPanel() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [days, setDays] = useState(7);
  const [notice, setNotice] = useState('');
  const [revokeUser, setRevokeUser] = useState<AdminUser | null>(null);
  const users = useAdminUsers(search, page, true);
  const mutation = useSetDemoPremium();

  function searchUsers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function changePlan(user: AdminUser, action: 'grant' | 'revoke') {
    setNotice('');
    try {
      const result = await mutation.mutateAsync({ email: user.email, days, action });
      setNotice(
        action === 'grant'
          ? `Đã cấp Premium demo cho ${result.email} đến ${new Date(result.currentPeriodEnd!).toLocaleDateString('vi-VN')}.`
          : `Đã thu hồi Premium demo của ${result.email}.`,
      );
      setRevokeUser(null);
    } catch {
      /* The mutation error is displayed below. */
    }
  }

  return (
    <section className="admin-premium" aria-label="Quản lý Premium demo">
      <h2>Người dùng và Premium demo</h2>
      <p className="small">
        Cấp quyền thử nghiệm cho tài khoản đã đăng ký. Không có thanh toán hoặc gia hạn tự động.
      </p>
      <div className="admin-premium-toolbar">
        <form onSubmit={searchUsers} role="search">
          <label>
            Tìm theo tên hoặc email
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tên hoặc email người dùng"
            />
          </label>
          <button type="submit">Tìm</button>
        </form>
        <label>
          Số ngày khi cấp (1–30)
          <input
            type="number"
            min={1}
            max={30}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          />
        </label>
      </div>
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {mutation.isError && (
        <p role="alert" className="error">
          {mutation.error.message}
        </p>
      )}
      {users.isPending && <p>Đang tải người dùng…</p>}
      {users.isError && (
        <p role="alert" className="error">
          {users.error.message}{' '}
          <button type="button" onClick={() => void users.refetch()}>
            Thử lại
          </button>
        </p>
      )}
      {users.data && (
        <>
          <p className="small">
            {users.data.meta.total} tài khoản · trang {page}
          </p>
          {users.data.data.length === 0 && <p>Không tìm thấy tài khoản phù hợp.</p>}
          <div className="admin-premium-list">
            {users.data.data.map((user) => (
              <article className="admin-premium-user" key={user.id}>
                <div>
                  <strong>{user.displayName}</strong>
                  <span>{user.email}</span>
                  <small>
                    {user.plan === 'PREMIUM'
                      ? `Premium đến ${new Date(user.currentPeriodEnd!).toLocaleDateString('vi-VN')}`
                      : 'Gói Free'}
                  </small>
                </div>
                {user.plan === 'PREMIUM' ? (
                  <button
                    type="button"
                    className="admin-reject"
                    disabled={mutation.isPending}
                    onClick={() => setRevokeUser(user)}
                  >
                    Thu hồi
                  </button>
                ) : (
                  <button
                    type="button"
                    className="primary"
                    disabled={mutation.isPending || days < 1 || days > 30}
                    onClick={() => void changePlan(user, 'grant')}
                  >
                    Cấp Premium
                  </button>
                )}
              </article>
            ))}
          </div>
          <div className="admin-premium-pages">
            <button type="button" disabled={page <= 1 || users.isFetching} onClick={() => setPage(page - 1)}>
              Trang trước
            </button>
            <button
              type="button"
              disabled={!users.data.meta.hasNext || users.isFetching}
              onClick={() => setPage(page + 1)}
            >
              Trang sau
            </button>
          </div>
        </>
      )}
      {revokeUser && (
        <div className="admin-decision" role="group" aria-label="Xác nhận thu hồi Premium">
          <p>
            Thu hồi Premium demo của <strong>{revokeUser.displayName}</strong> ({revokeUser.email})?
          </p>
          <div className="admin-actions">
            <button type="button" onClick={() => setRevokeUser(null)} disabled={mutation.isPending}>
              Giữ nguyên
            </button>
            <button
              type="button"
              className="admin-reject"
              onClick={() => void changePlan(revokeUser, 'revoke')}
              disabled={mutation.isPending}
            >
              Xác nhận thu hồi
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
