import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction } from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './shared/filters/domain-exception.filter';

const REQUIRED_ENV = ['JWT_SECRET', 'DB_PASSWORD', 'DB_DATABASE'];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length) {
    console.error(`[startup] Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(cookieParser());
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

  app.useGlobalFilters(new DomainExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('REST API para el Blog CMS')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
