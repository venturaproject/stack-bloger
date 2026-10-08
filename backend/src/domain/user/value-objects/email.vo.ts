export class Email {
  readonly value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email: ${value}`);
    }
    this.value = value.toLowerCase().trim();
  }

  private isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
