import { Request } from 'express';

export function getSessionToken(request: Request): string | undefined {
  const cookieName = process.env.NODE_ENV === 'production' ? '__Host-seatnow_sid' : 'seatnow_sid';
  const cookies: unknown = request.cookies;
  if (typeof cookies !== 'object' || cookies === null || !(cookieName in cookies)) return undefined;
  const token: unknown = cookies[cookieName as keyof typeof cookies];
  return typeof token === 'string' ? token : undefined;
}
