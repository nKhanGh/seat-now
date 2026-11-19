import { UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

export function assertBusinessAdminToken(authorization: string | undefined) {
  const token = process.env.BUSINESS_ADMIN_TOKEN;
  if (!token || !authorization?.startsWith('Bearer '))
    throw new UnauthorizedException('Business admin token required');
  const expected = createHash('sha256').update(token).digest();
  const supplied = createHash('sha256').update(authorization.slice(7)).digest();
  if (!timingSafeEqual(expected, supplied)) throw new UnauthorizedException('Business admin token required');
}
