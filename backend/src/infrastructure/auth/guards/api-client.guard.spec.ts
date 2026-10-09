import assert from 'node:assert/strict';
import test from 'node:test';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ApiClientGuard } from './api-client.guard';

function makeContext() {
  const handler = () => undefined;
  class Controller {}
  return {
    context: {
      switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: 'Bearer signed-token' } }) }),
      getHandler: () => handler,
      getClass: () => Controller,
    },
    handler,
    Controller,
  };
}

function makeGuard(scopes: string[], requiredScopes: string[], active = true) {
  const verifyAsync = async () => ({ typ: 'api_client', sub: 'client-1', scopes });
  const findOneBy = async () => active ? { id: 'client-1', scopes, active: true } : null;
  const reflector = { getAllAndOverride: () => requiredScopes };
  const guard = new ApiClientGuard(
    { verifyAsync } as never,
    reflector as never,
    { findOneBy } as never,
  );
  return { guard, ...makeContext() };
}

test('permits an active client when its explicit scope grants access', async () => {
  const { guard, context } = makeGuard(['posts:read'], ['posts:read']);
  assert.equal(await guard.canActivate(context as never), true);
});

test('forbids an active client when the required scope is missing', async () => {
  const { guard, context } = makeGuard(['posts:read'], ['categories:read']);
  await assert.rejects(() => guard.canActivate(context as never), (error: unknown) =>
    error instanceof ForbiddenException && error.getStatus() === 403,
  );
});

test('rejects a token whose client has been revoked', async () => {
  const { guard, context } = makeGuard(['posts:read'], ['posts:read'], false);
  await assert.rejects(() => guard.canActivate(context as never), (error: unknown) =>
    error instanceof UnauthorizedException && error.getStatus() === 401,
  );
});
