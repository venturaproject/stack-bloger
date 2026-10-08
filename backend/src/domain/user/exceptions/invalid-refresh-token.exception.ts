export class InvalidRefreshTokenException extends Error {
  readonly statusCode = 401;

  constructor(message = 'Invalid or expired refresh token') {
    super(message);
    this.name = 'InvalidRefreshTokenException';
  }
}
