import { FormEvent, useState } from 'react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useLogin, useRegister } from '../features/auth/api/authQueries';
import { MapExplorer } from '../features/map/pages/MapExplorer';

function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const navigate = useNavigate();
  const login = useLogin();
  const register = useRegister();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const mutation = mode === 'login' ? login : register;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (mode === 'login') await login.mutateAsync({ email, password });
      else await register.mutateAsync({ email, password, displayName });
      navigate('/');
    } catch { /* The error is displayed below. */ }
  }
  return <main className="auth-page"><Link to="/" className="brand">SeatNow</Link><form className="card" onSubmit={(event) => void submit(event)}>
    <p className="eyebrow">{mode === 'login' ? 'Chào mừng trở lại' : 'Bắt đầu với SeatNow'}</p><h1>{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h1>
    {mode === 'register' && <label>Tên hiển thị<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} minLength={1} maxLength={60} required autoComplete="name" /></label>}
    <label>Email<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required autoComplete="email" /></label>
    <label>Mật khẩu<input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={mode === 'register' ? 12 : undefined} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></label>
    {mutation.error && <p role="alert" className="error">{mutation.error.message}</p>}
    <button className="primary" disabled={mutation.isPending}>{mutation.isPending ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
    <p>{mode === 'login' ? <>Chưa có tài khoản? <Link to="/register">Đăng ký</Link></> : <>Đã có tài khoản? <Link to="/login">Đăng nhập</Link></>}</p>
  </form></main>;
}

export function App() {
  return <Routes><Route path="/" element={<MapExplorer />} /><Route path="/login" element={<AuthForm mode="login" />} /><Route path="/register" element={<AuthForm mode="register" />} /></Routes>;
}
