export type User = { id: string; email: string; displayName: string; emailVerified: boolean };
type Envelope<T> = { data: T };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/auth/${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error('Email hoặc mật khẩu chưa đúng, hoặc phiên đã hết hạn.');
    if (response.status === 409) throw new Error('Email này đã được đăng ký.');
    if (response.status === 429) throw new Error('Bạn thử quá nhiều lần. Vui lòng chờ một chút.');
    throw new Error(`Yêu cầu thất bại (${response.status}).`);
  }
  if (response.status === 204) return undefined as T;
  const body = (await response.json()) as Envelope<T>;
  return body.data;
}

export const authService = {
  me: () => request<User>('me'),
  login: (email: string, password: string) =>
    request<User>('login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, displayName: string) =>
    request<User>('register', { method: 'POST', body: JSON.stringify({ email, password, displayName }) }),
  logout: () => request<void>('logout', { method: 'POST' }),
};
