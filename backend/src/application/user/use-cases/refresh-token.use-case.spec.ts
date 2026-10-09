import assert from 'node:assert/strict';
import test from 'node:test';
import { RefreshTokenUseCase } from './refresh-token.use-case';
import { IUserRefreshTokenRepository } from '../../../domain/user/repositories/user-refresh-token.repository.interface';
import { UserRefreshTokenEntity } from '../../../infrastructure/database/entities/user-refresh-token.entity';

function setup(rotation: 'rotated' | 'reused' | 'invalid') {
  const token = { id: 31, userId: 7, user: { id: 7 } } as UserRefreshTokenEntity;
  let rotatedWith: { id: number; tokenHash: string; expiresAt: Date } | null = null;
  let signedSubject: number | undefined;
  const repository: IUserRefreshTokenRepository = {
    create: async () => token,
    findByToken: async () => token,
    markAsUsed: async () => token,
    rotate: async (id, tokenHash, expiresAt) => {
      rotatedWith = { id, tokenHash, expiresAt };
      return rotation;
    },
    revokeAllForUser: async () => undefined,
  };
  const jwt = { sign: (payload: { sub: number }) => { signedSubject = payload.sub; return 'access-token'; } };
  return { useCase: new RefreshTokenUseCase(repository, jwt as never), get rotatedWith() { return rotatedWith; }, get signedSubject() { return signedSubject; } };
}

test('rotates via the atomic repository operation and issues an access token', async () => {
  const state = setup('rotated');
  const result = await state.useCase.execute('raw-refresh-token');
  assert.equal(state.rotatedWith?.id, 31);
  assert.match(state.rotatedWith?.tokenHash ?? '', /^[a-f0-9]{64}$/);
  assert.equal(state.signedSubject, 7);
  assert.equal(result.accessToken, 'access-token');
  assert.notEqual(result.refreshToken, 'raw-refresh-token');
});

test('does not issue access tokens when rotation detects token reuse', async () => {
  const state = setup('reused');
  await assert.rejects(() => state.useCase.execute('raw-refresh-token'), /already used/);
  assert.equal(state.signedSubject, undefined);
});
