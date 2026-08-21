/**
 * Money value object.
 * Represents monetary amounts in cents to avoid floating point precision issues.
 * All monetary calculations MUST go through this type.
 */
export class Money {
  private readonly _cents: number;
  private readonly _currency: string;

  private constructor(cents: number, currency: string) {
    if (!Number.isInteger(cents)) {
      throw new Error(`Money must be an integer of cents. Got: ${cents}`);
    }
    if (cents < 0) {
      throw new Error(`Money cannot be negative. Got: ${cents}`);
    }
    this._cents = cents;
    this._currency = currency.toUpperCase();
  }

  /** Create Money from a decimal amount (e.g., 12.50) and currency code */
  static fromDecimal(amount: number, currency: string = 'MXN'): Money {
    if (!Number.isFinite(amount)) {
      throw new Error(`Amount must be finite. Got: ${amount}`);
    }
    if (amount < 0) {
      throw new Error(`Amount cannot be negative. Got: ${amount}`);
    }
    const cents = Math.round(amount * 100);
    return new Money(cents, currency);
  }

  /** Create Money from cents (e.g., 1250 for $12.50) */
  static fromCents(cents: number, currency: string = 'MXN'): Money {
    return new Money(cents, currency);
  }

  /** Create zero Money */
  static zero(currency: string = 'MXN'): Money {
    return new Money(0, currency);
  }

  get cents(): number {
    return this._cents;
  }

  get currency(): string {
    return this._currency;
  }

  /** Get decimal amount */
  toDecimal(): number {
    return this._cents / 100;
  }

  /** Format for display (e.g., "$12.50") */
  format(): string {
    const amount = this.toDecimal();
    return `$${amount.toFixed(2)} ${this._currency}`;
  }

  /** Format without currency symbol */
  formatAmount(): string {
    return this.toDecimal().toFixed(2);
  }

  add(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this._cents + other._cents, this._currency);
  }

  subtract(other: Money): Money {
    this.assertSameCurrency(other);
    if (other._cents > this._cents) {
      throw new Error('Result would be negative');
    }
    return new Money(this._cents - other._cents, this._currency);
  }

  multiply(factor: number): Money {
    if (!Number.isFinite(factor) || factor < 0) {
      throw new Error(`Factor must be a non-negative finite number. Got: ${factor}`);
    }
    return new Money(Math.round(this._cents * factor), this._currency);
  }

  isGreaterThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._cents > other._cents;
  }

  isGreaterThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._cents >= other._cents;
  }

  isLessThan(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._cents < other._cents;
  }

  isLessThanOrEqual(other: Money): boolean {
    this.assertSameCurrency(other);
    return this._cents <= other._cents;
  }

  equals(other: Money): boolean {
    return this._cents === other._cents && this._currency === other._currency;
  }

  isZero(): boolean {
    return this._cents === 0;
  }

  /** Get the absolute difference between two Money values */
  difference(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(Math.abs(this._cents - other._cents), this._currency);
  }

  private assertSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(`Currency mismatch: ${this._currency} vs ${other._currency}`);
    }
  }

  toJSON(): { cents: number; currency: string } {
    return { cents: this._cents, currency: this._currency };
  }

  static fromJSON(data: { cents: number; currency: string }): Money {
    return new Money(data.cents, data.currency);
  }

  toString(): string {
    return this.format();
  }
}
