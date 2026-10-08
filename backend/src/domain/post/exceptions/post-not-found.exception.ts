export class PostNotFoundException extends Error {
  constructor(identifier?: string | number) {
    super(identifier ? `Post not found: ${identifier}` : 'Post not found');
    this.name = 'PostNotFoundException';
  }
}
