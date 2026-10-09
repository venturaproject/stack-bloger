import assert from 'node:assert/strict';
import test from 'node:test';
import { hasTrustedRequestOrigin } from './request-origin';

const expectedOrigin = 'https://blog.example.com';

test('accepts same-origin mutations with a session cookie', () => {
  assert.equal(hasTrustedRequestOrigin({ method: 'POST', path: '/api/v1/settings/display', hasSessionCookie: true, origin: expectedOrigin, expectedOrigin }), true);
});

test('rejects cross-origin mutations with a session cookie', () => {
  assert.equal(hasTrustedRequestOrigin({ method: 'POST', path: '/api/v1/settings/display', hasSessionCookie: true, origin: 'https://attacker.example', expectedOrigin }), false);
});

test('rejects cookie-authenticated mutations with no Origin or Referer', () => {
  assert.equal(hasTrustedRequestOrigin({ method: 'DELETE', path: '/api/v1/posts/1', hasSessionCookie: true, expectedOrigin }), false);
});

test('checks login CSRF even before a session cookie exists', () => {
  assert.equal(hasTrustedRequestOrigin({ method: 'POST', path: '/api/v1/auth/login', hasSessionCookie: false, origin: 'https://attacker.example', expectedOrigin }), false);
});

test('does not require browser origins for Bearer-only integrations', () => {
  assert.equal(hasTrustedRequestOrigin({ method: 'POST', path: '/api/v1/integrations/posts', hasSessionCookie: false, expectedOrigin }), true);
});

test('allows safe methods regardless of request origin', () => {
  assert.equal(hasTrustedRequestOrigin({ method: 'GET', path: '/api/v1/users', hasSessionCookie: true, origin: 'https://attacker.example', expectedOrigin }), true);
});
