export class CategoryNotFoundException extends Error {
  constructor(identifier?: string | number) {
    super(identifier ? `Category not found: ${identifier}` : 'Category not found');
    this.name = 'CategoryNotFoundException';
  }
}
