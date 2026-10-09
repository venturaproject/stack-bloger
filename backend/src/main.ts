import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './infrastructure/http/http-exception.filter';
import { hasTrustedRequestOrigin } from './infrastructure/auth/security/request-origin';

const REQUIRED_ENV = ['JWT_SECRET', 'DB_PASSWORD', 'DB_DATABASE'];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (Buffer.byteLength(process.env.JWT_SECRET ?? '', 'utf8') < 32) {
    console.error('[startup] JWT_SECRET must contain at least 32 bytes');
    process.exit(1);
  }
  if (process.env.API_CLIENT_JWT_SECRET && Buffer.byteLength(process.env.API_CLIENT_JWT_SECRET, 'utf8') < 32) {
    console.error('[startup] API_CLIENT_JWT_SECRET must contain at least 32 bytes');
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Trust only the single Nginx hop in front of this container so req.ip and
  // throttling use the client address forwarded by the trusted proxy.
  app.set('trust proxy', 1);
  app.use(cookieParser());
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const expectedOrigin = new URL(frontendUrl).origin;
    if (!hasTrustedRequestOrigin({
      method: req.method,
      path: req.path,
      hasSessionCookie: Boolean(req.cookies?.access_token || req.cookies?.refresh_token),
      origin: req.get('origin'),
      referer: req.get('referer'),
      expectedOrigin,
    })) {
      return res.status(403).json({ statusCode: 403, message: 'Invalid request origin' });
    }
    next();
  });
  app.use('/avatars/:filename', (req: Request, res: Response, next: NextFunction) => {
    const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;
    if (filename?.startsWith('avatar-')) {
      return res.status(404).send('Not Found');
    }
    next();
  });
  app.useStaticAssets(join(process.cwd(), 'public'));
  app.useStaticAssets(join(process.cwd(), 'public', 'uploads'), { prefix: '/api/uploads' });

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  if (process.env.NODE_ENV !== 'production' || process.env.SWAGGER_ENABLED === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Blog API')
      .setDescription('REST API para el Blog CMS')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
