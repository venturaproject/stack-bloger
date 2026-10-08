export class UserNotFoundException extends Error {
  readonly statusCode = 404;

  constructor(id: number) {
    super(`User with id ${id} not found`);
    this.name = 'UserNotFoundException';
  }
}
