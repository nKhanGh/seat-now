import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  if (!process.env.MONGODB_URI || !process.env.PUBLIC_ORIGIN) {
    throw new Error('MONGODB_URI and PUBLIC_ORIGIN are required');
  }
  if (process.env.NODE_ENV === 'production' && !process.env.PUBLIC_ORIGIN.startsWith('https://')) {
    throw new Error('PUBLIC_ORIGIN must use HTTPS in production');
  }
  if (
    process.env.NODE_ENV === 'production' &&
    (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  ) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production');
  }
  app.setGlobalPrefix('api/v1');
  const mapAssetOrigins = (
    process.env.MAP_ASSET_ORIGINS ?? 'https://tiles.openfreemap.org,https://assets.openfreemap.com'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const socketOrigin = process.env.PUBLIC_ORIGIN.replace(/^http/, 'ws');
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:', ...mapAssetOrigins],
          connectSrc: ["'self'", socketOrigin, ...mapAssetOrigins],
          workerSrc: ["'self'", 'blob:'],
          fontSrc: ["'self'", 'data:', ...mapAssetOrigins],
        },
      },
    }),
  );
  app.use(cookieParser());
  app.enableCors({ origin: process.env.PUBLIC_ORIGIN, credentials: true });
  app.use(
    (
      request: { method: string; path: string; headers: Record<string, string | undefined> },
      response: { status: (code: number) => { json: (body: object) => void } },
      next: () => void,
    ) => {
      if (
        ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method) &&
        !request.path.startsWith('/api/v1/internal/') &&
        request.headers.origin !== process.env.PUBLIC_ORIGIN
      ) {
        response.status(403).json({ statusCode: 403, code: 'INVALID_ORIGIN', message: ['Invalid origin'] });
        return;
      }
      next();
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: errors.map((error) => Object.values(error.constraints ?? {}).join(', ')),
        }),
    }),
  );
  const frontendDist = process.env.FRONTEND_DIST_PATH ?? join(__dirname, '..', '..', 'frontend', 'dist');
  if (existsSync(join(frontendDist, 'index.html'))) {
    app.useStaticAssets(frontendDist);
    app.use(
      (
        request: { method: string; path: string },
        response: { sendFile: (path: string) => void },
        next: () => void,
      ) => {
        if (
          request.method === 'GET' &&
          ([
            '/login',
            '/register',
            '/plans',
            '/favorites',
            '/following',
            '/proposals',
            '/business',
            '/bookings',
          ].includes(request.path) ||
            /^\/users\/[a-f0-9]{24}$/.test(request.path))
        ) {
          response.sendFile(join(frontendDist, 'index.html'));
          return;
        }
        next();
      },
    );
  }
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}

void bootstrap();
