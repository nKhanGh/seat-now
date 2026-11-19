import { ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { timingSafeEqual } from 'node:crypto';

export function assertIngestToken(authorization: string | undefined) {
  const secret = process.env.AVAILABILITY_INGEST_TOKEN;
  if (!secret) throw new ServiceUnavailableException('Availability ingestion is not configured');
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(authorization ?? '');
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new UnauthorizedException();
}
