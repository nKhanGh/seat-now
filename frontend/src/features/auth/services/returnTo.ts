export function safeReturnTo(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const url = new URL(value, 'https://seatnow.local');
    if (url.origin !== 'https://seatnow.local') return '/';
    if (url.pathname === '/login' || url.pathname === '/register') return '/';
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
