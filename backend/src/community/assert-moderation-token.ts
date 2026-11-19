import { UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';

export function assertModerationToken(authorization: string | undefined) {
  const token = process.env.COMMUNITY_MODERATION_TOKEN;
  if (!token || !authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Moderation token required');
  const supplied = authorization.slice(7);
  const expectedHash = createHash('sha256').update(token).digest();
  const suppliedHash = createHash('sha256').update(supplied).digest();
  if (!timingSafeEqual(expectedHash, suppliedHash)) throw new UnauthorizedException('Moderation token required');
}
