export class TagNotFoundException extends Error {
  constructor(identifier?: string | number) {
    super(identifier ? `Tag not found: ${identifier}` : 'Tag not found');
    this.name = 'TagNotFoundException';
  }
}
