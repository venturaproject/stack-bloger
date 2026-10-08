export class InvalidCredentialsException extends Error {
  readonly statusCode = 401;

  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsException';
  }
}
