const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function hasTrustedRequestOrigin(input: {
  method: string;
  path: string;
  hasSessionCookie: boolean;
  origin?: string;
  referer?: string;
  expectedOrigin: string;
}): boolean {
  if (SAFE_METHODS.has(input.method.toUpperCase())) return true;
  const loginAttempt = input.method.toUpperCase() === 'POST' && input.path === '/api/v1/auth/login';
  if (!input.hasSessionCookie && !loginAttempt) return true;

  let requestOrigin = input.origin;
  if (!requestOrigin && input.referer) {
    try {
      requestOrigin = new URL(input.referer).origin;
    } catch {
      return false;
    }
  }

  return requestOrigin === input.expectedOrigin;
}
