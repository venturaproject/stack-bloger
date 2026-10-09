import assert from 'node:assert/strict';
import test from 'node:test';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { hash } from 'bcryptjs';
import request from 'supertest';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LoginUseCase } from '../../application/user/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/user/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/user/use-cases/logout.use-case';
import { GetCurrentUserProfileUseCase } from '../../application/user/use-cases/get-current-user-profile.use-case';
import { ApiClientTokenController } from '../web/api-clients.controller';
import { ApiClientEntity } from '../database/entities/api-client.entity';
import { API_CLIENT_JWT_SERVICE } from './security/api-client-jwt.constants';

test('login endpoint sets HttpOnly, Secure, SameSite cookies and never returns tokens in JSON', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: LoginUseCase, useValue: { execute: async () => ({ accessToken: 'access-secret', refreshToken: 'refresh-secret', tokenType: 'bearer', expiresIn: 900, user: { id: 3, name: 'Test', email: 'test@example.com', roles: ['admin'], permissions: [], avatar: null } }) } },
      { provide: RefreshTokenUseCase, useValue: {} },
      { provide: LogoutUseCase, useValue: {} },
      { provide: GetCurrentUserProfileUseCase, useValue: {} },
      { provide: ConfigService, useValue: { get: (_key: string, fallback: number) => fallback } },
      { provide: JwtAuthGuard, useValue: { canActivate: () => true } },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  try {
    await app.init();
    const response = await request(app.getHttpServer()).post('/api/v1/auth/login').send({ login: 'test@example.com', password: 'not-used' }).expect(201);
    const cookies = response.headers['set-cookie'] as unknown as string[];
    assert.equal(cookies.length, 2);
    assert.ok(cookies.every((cookie) => /HttpOnly/i.test(cookie) && /Secure/i.test(cookie) && /SameSite=Lax/i.test(cookie)));
    assert.equal(JSON.stringify(response.body).includes('access-secret'), false);
    assert.equal(JSON.stringify(response.body).includes('refresh-secret'), false);
  } finally {
    await app.close();
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test('OAuth client-credentials endpoint issues a short-lived, non-cacheable token using HTTP Basic', async () => {
  const clientSecret = 'integration-test-client-secret';
  const client: Partial<ApiClientEntity> = {
    id: 'client-uuid',
    clientId: 'blog_integration',
    secretHash: await hash(clientSecret, 4),
    scopes: ['posts:read'],
    active: true,
    lastUsedAt: null,
  };
  const state: { savedLastUsedAt?: Date } = {};
  let signedOptions: Record<string, unknown> | undefined;

  const moduleRef = await Test.createTestingModule({
    controllers: [ApiClientTokenController],
    providers: [
      { provide: getRepositoryToken(ApiClientEntity), useValue: {
        findOneBy: async () => client,
        save: async (value: ApiClientEntity) => { state.savedLastUsedAt = value.lastUsedAt ?? undefined; return value; },
      } },
      { provide: API_CLIENT_JWT_SERVICE, useValue: {
        signAsync: async (_payload: unknown, options: Record<string, unknown>) => { signedOptions = options; return 'signed-access-token'; },
      } },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  try {
    await app.init();
    const response = await request(app.getHttpServer())
      .post('/api/v1/oauth/token')
      .auth(client.clientId!, clientSecret)
      .type('form')
      .send({ grant_type: 'client_credentials' })
      .expect(201);

    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.body.access_token, 'signed-access-token');
    assert.equal(response.body.expires_in, 900);
    assert.equal(response.body.scope, 'posts:read');
    assert.ok(state.savedLastUsedAt instanceof Date);
    assert.equal(signedOptions?.audience, 'blog-integration-api');
    assert.equal(signedOptions?.issuer, 'boilerplate-api-clients');

    await request(app.getHttpServer())
      .post('/api/v1/oauth/token')
      .auth(client.clientId!, 'incorrect-secret')
      .type('form')
      .send({ grant_type: 'client_credentials' })
      .expect(401);
  } finally {
    await app.close();
  }
});
