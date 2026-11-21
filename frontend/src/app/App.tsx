import { FormEvent, lazy, Suspense, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useLogin, useRegister } from '../features/auth/api/authQueries';
import { loginDestination } from '../features/auth/services/loginDestination';
import { safeReturnTo } from '../features/auth/services/returnTo';
import { getMyBusinessVenues } from '../features/business/services/business.service';
const MapExplorer = lazy(() =>
  import('../features/map/pages/MapExplorer').then((module) => ({ default: module.MapExplorer })),
);
const PlansPage = lazy(() =>
  import('../features/subscription/pages/PlansPage').then((module) => ({ default: module.PlansPage })),
);
const FavoritesPage = lazy(() =>
  import('../features/community/pages/FavoritesPage').then((module) => ({ default: module.FavoritesPage })),
);
const PublicProfilePage = lazy(() =>
  import('../features/community/pages/PublicProfilePage').then((module) => ({
    default: module.PublicProfilePage,
  })),
);
const FollowingPage = lazy(() =>
  import('../features/community/pages/FollowingPage').then((module) => ({ default: module.FollowingPage })),
);
const ProposalsPage = lazy(() =>
  import('../features/community/pages/ProposalsPage').then((module) => ({ default: module.ProposalsPage })),
);
const BusinessPage = lazy(() =>
  import('../features/business/pages/BusinessPage').then((module) => ({ default: module.BusinessPage })),
);
const BusinessOverviewPage = lazy(() =>
  import('../features/business/pages/BusinessOverviewPage').then((module) => ({
    default: module.BusinessOverviewPage,
  })),
);
const BusinessClaimsPage = lazy(() =>
  import('../features/business/pages/BusinessClaimsPage').then((module) => ({
    default: module.BusinessClaimsPage,
  })),
);
const BusinessVenuePage = lazy(() =>
  import('../features/business/pages/BusinessVenuePage').then((module) => ({
    default: module.BusinessVenuePage,
  })),
);
const MyBookingsPage = lazy(() =>
  import('../features/booking/pages/MyBookingsPage').then((module) => ({ default: module.MyBookingsPage })),
);
const AdminPage = lazy(() =>
  import('../features/admin/pages/AdminPage').then((module) => ({ default: module.AdminPage })),
);

function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = safeReturnTo((location.state as { returnTo?: unknown } | null)?.returnTo);
  const login = useLogin();
  const register = useRegister();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [displayName, setDisplayName] = useState('');
  const mutation = mode === 'login' ? login : register;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    if (mode === 'register' && password !== confirmPassword) {
      setFormError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    try {
      const user =
        mode === 'login'
          ? await login.mutateAsync({ email, password })
          : await register.mutateAsync({ email, password, displayName });
      const destination =
        mode === 'login'
          ? await loginDestination(user.role, returnTo, async () => (await getMyBusinessVenues()).length > 0)
          : returnTo;
      void navigate(destination, { replace: true });
    } catch {
      /* The error is displayed below. */
    }
  }
  return (
    <main className="auth-page">
      <Link to="/" className="brand">
        SeatNow
      </Link>
      <form className="card" onSubmit={(event) => void submit(event)}>
        <p className="eyebrow">{mode === 'login' ? 'Chào mừng trở lại' : 'Bắt đầu với SeatNow'}</p>
        <h1>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h1>
        {mode === 'register' && (
          <label>
            Tên hiển thị
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={1}
              maxLength={60}
              required
              autoComplete="name"
            />
          </label>
        )}
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
            autoComplete="email"
          />
        </label>
        <label>
          Mật khẩu
          <span className="password-field">
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              minLength={mode === 'register' ? 12 : undefined}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </span>
        </label>
        {mode === 'register' && (
          <label>
            Xác nhận mật khẩu
            <input
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              type={showPassword ? 'text' : 'password'}
              minLength={12}
              required
              autoComplete="new-password"
            />
          </label>
        )}
        {formError && (
          <p role="alert" className="error">
            {formError}
          </p>
        )}
        {mutation.error && (
          <p role="alert" className="error">
            {mutation.error.message}
          </p>
        )}
        <button className="primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
        </button>
        <p>
          {mode === 'login' ? (
            <>
              Chưa có tài khoản?{' '}
              <Link to="/register" state={{ returnTo }}>
                Đăng ký
              </Link>
            </>
          ) : (
            <>
              Đã có tài khoản?{' '}
              <Link to="/login" state={{ returnTo }}>
                Đăng nhập
              </Link>
            </>
          )}
        </p>
      </form>
    </main>
  );
}

export function App() {
  return (
    <Suspense
      fallback={
        <p className="route-loading" role="status">
          Đang tải trang…
        </p>
      }
    >
      <Routes>
        <Route path="/" element={<MapExplorer />} />
        <Route path="/login" element={<AuthForm mode="login" />} />
        <Route path="/register" element={<AuthForm mode="register" />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/following" element={<FollowingPage />} />
        <Route path="/users/:id" element={<PublicProfilePage />} />
        <Route path="/proposals" element={<ProposalsPage />} />
        <Route path="/business" element={<BusinessPage />}>
          <Route index element={<BusinessOverviewPage />} />
          <Route path="claims" element={<BusinessClaimsPage />} />
          <Route path="venues/:slug/:section" element={<BusinessVenuePage />} />
        </Route>
        <Route path="/bookings" element={<MyBookingsPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Suspense>
  );
}
