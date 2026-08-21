import { Money } from '../../domain/valueObjects/Money';

describe('Money Value Object', () => {
  describe('Creation', () => {
    it('creates from decimal amount', () => {
      const money = Money.fromDecimal(12.5, 'MXN');
      expect(money.cents).toBe(1250);
      expect(money.currency).toBe('MXN');
      expect(money.toDecimal()).toBe(12.5);
    });

    it('creates from cents', () => {
      const money = Money.fromCents(1250, 'MXN');
      expect(money.cents).toBe(1250);
      expect(money.currency).toBe('MXN');
      expect(money.toDecimal()).toBe(12.5);
    });

    it('defaults currency to MXN', () => {
      const money = Money.fromDecimal(10);
      expect(money.currency).toBe('MXN');
    });

    it('creates zero money', () => {
      const money = Money.zero();
      expect(money.cents).toBe(0);
      expect(money.toDecimal()).toBe(0);
      expect(money.isZero()).toBe(true);
    });

    it('normalizes currency to uppercase', () => {
      const money = Money.fromDecimal(10, 'usd');
      expect(money.currency).toBe('USD');
    });

    it('handles rounding correctly for decimal amounts', () => {
      const money = Money.fromDecimal(19.99);
      expect(money.cents).toBe(1999);
      expect(money.toDecimal()).toBe(19.99);
    });

    it('rounds properly when cents would have decimals', () => {
      const money = Money.fromDecimal(10.005);
      expect(money.cents).toBe(1001);
    });
  });

  describe('Edge Cases - Very Small and Large Amounts', () => {
    it('handles very small amounts (1 cent)', () => {
      const money = Money.fromDecimal(0.01);
      expect(money.cents).toBe(1);
      expect(money.toDecimal()).toBe(0.01);
    });

    it('handles zero amount', () => {
      const money = Money.fromDecimal(0);
      expect(money.cents).toBe(0);
      expect(money.isZero()).toBe(true);
    });

    it('handles large amounts', () => {
      const money = Money.fromDecimal(999999.99);
      expect(money.cents).toBe(99999999);
      expect(money.toDecimal()).toBe(999999.99);
    });

    it('handles amount with many decimal places via rounding', () => {
      const money = Money.fromDecimal(1.001);
      expect(money.cents).toBe(100);
    });
  });

  describe('Validation - Error Cases', () => {
    it('throws on negative decimal amount', () => {
      expect(() => Money.fromDecimal(-1)).toThrow('Amount cannot be negative');
    });

    it('throws on negative cents', () => {
      expect(() => Money.fromCents(-100)).toThrow('Money cannot be negative');
    });

    it('throws on NaN amount', () => {
      expect(() => Money.fromDecimal(NaN)).toThrow('Amount must be finite');
    });

    it('throws on Infinity amount', () => {
      expect(() => Money.fromDecimal(Infinity)).toThrow('Amount must be finite');
    });

    it('throws on non-integer cents', () => {
      expect(() => Money.fromCents(100.5)).toThrow('Money must be an integer of cents');
    });
  });

  describe('Addition', () => {
    it('adds two money values', () => {
      const a = Money.fromDecimal(10.5);
      const b = Money.fromDecimal(5.25);
      const result = a.add(b);
      expect(result.cents).toBe(1575);
      expect(result.toDecimal()).toBeCloseTo(15.75, 2);
    });

    it('adds zero', () => {
      const a = Money.fromDecimal(10);
      const b = Money.zero();
      const result = a.add(b);
      expect(result.cents).toBe(1000);
    });

    it('throws on currency mismatch', () => {
      const a = Money.fromDecimal(10, 'MXN');
      const b = Money.fromDecimal(5, 'USD');
      expect(() => a.add(b)).toThrow('Currency mismatch');
    });
  });

  describe('Subtraction', () => {
    it('subtracts two money values', () => {
      const a = Money.fromDecimal(15.75);
      const b = Money.fromDecimal(5.25);
      const result = a.subtract(b);
      expect(result.cents).toBe(1050);
      expect(result.toDecimal()).toBeCloseTo(10.5, 2);
    });

    it('subtracts to zero', () => {
      const a = Money.fromDecimal(10);
      const b = Money.fromDecimal(10);
      const result = a.subtract(b);
      expect(result.isZero()).toBe(true);
    });

    it('throws when result would be negative', () => {
      const a = Money.fromDecimal(5);
      const b = Money.fromDecimal(10);
      expect(() => a.subtract(b)).toThrow('Result would be negative');
    });

    it('throws on currency mismatch', () => {
      const a = Money.fromDecimal(10, 'MXN');
      const b = Money.fromDecimal(5, 'USD');
      expect(() => a.subtract(b)).toThrow('Currency mismatch');
    });
  });

  describe('Multiplication', () => {
    it('multiplies by integer factor', () => {
      const money = Money.fromDecimal(10);
      const result = money.multiply(3);
      expect(result.cents).toBe(3000);
    });

    it('multiplies by zero', () => {
      const money = Money.fromDecimal(100);
      const result = money.multiply(0);
      expect(result.isZero()).toBe(true);
    });

    it('multiplies by decimal factor', () => {
      const money = Money.fromDecimal(100);
      const result = money.multiply(0.15);
      expect(result.cents).toBe(1500);
    });

    it('rounds result to nearest cent', () => {
      const money = Money.fromDecimal(10.03);
      const result = money.multiply(3);
      expect(result.cents).toBe(3009);
    });

    it('throws on negative factor', () => {
      const money = Money.fromDecimal(10);
      expect(() => money.multiply(-1)).toThrow('Factor must be a non-negative finite number');
    });

    it('throws on NaN factor', () => {
      const money = Money.fromDecimal(10);
      expect(() => money.multiply(NaN)).toThrow('Factor must be a non-negative finite number');
    });

    it('throws on Infinity factor', () => {
      const money = Money.fromDecimal(10);
      expect(() => money.multiply(Infinity)).toThrow('Factor must be a non-negative finite number');
    });
  });

  describe('Comparison Operators', () => {
    it('isGreaterThan', () => {
      expect(Money.fromDecimal(10).isGreaterThan(Money.fromDecimal(5))).toBe(true);
      expect(Money.fromDecimal(5).isGreaterThan(Money.fromDecimal(10))).toBe(false);
      expect(Money.fromDecimal(10).isGreaterThan(Money.fromDecimal(10))).toBe(false);
    });

    it('isGreaterThanOrEqual', () => {
      expect(Money.fromDecimal(10).isGreaterThanOrEqual(Money.fromDecimal(5))).toBe(true);
      expect(Money.fromDecimal(10).isGreaterThanOrEqual(Money.fromDecimal(10))).toBe(true);
      expect(Money.fromDecimal(5).isGreaterThanOrEqual(Money.fromDecimal(10))).toBe(false);
    });

    it('isLessThan', () => {
      expect(Money.fromDecimal(5).isLessThan(Money.fromDecimal(10))).toBe(true);
      expect(Money.fromDecimal(10).isLessThan(Money.fromDecimal(5))).toBe(false);
      expect(Money.fromDecimal(10).isLessThan(Money.fromDecimal(10))).toBe(false);
    });

    it('isLessThanOrEqual', () => {
      expect(Money.fromDecimal(5).isLessThanOrEqual(Money.fromDecimal(10))).toBe(true);
      expect(Money.fromDecimal(10).isLessThanOrEqual(Money.fromDecimal(10))).toBe(true);
      expect(Money.fromDecimal(10).isLessThanOrEqual(Money.fromDecimal(5))).toBe(false);
    });

    it('equals', () => {
      expect(Money.fromDecimal(10).equals(Money.fromDecimal(10))).toBe(true);
      expect(Money.fromDecimal(10).equals(Money.fromDecimal(5))).toBe(false);
    });

    it('equals considers currency', () => {
      expect(Money.fromDecimal(10, 'MXN').equals(Money.fromDecimal(10, 'USD'))).toBe(false);
    });

    it('throws on currency mismatch for comparisons', () => {
      const a = Money.fromDecimal(10, 'MXN');
      const b = Money.fromDecimal(5, 'USD');
      expect(() => a.isGreaterThan(b)).toThrow('Currency mismatch');
      expect(() => a.isLessThan(b)).toThrow('Currency mismatch');
    });
  });

  describe('Difference', () => {
    it('calculates positive difference', () => {
      const diff = Money.fromDecimal(15).difference(Money.fromDecimal(10));
      expect(diff.cents).toBe(500);
    });

    it('calculates absolute difference (reverse order)', () => {
      const diff = Money.fromDecimal(10).difference(Money.fromDecimal(15));
      expect(diff.cents).toBe(500);
    });

    it('difference of equal values is zero', () => {
      const diff = Money.fromDecimal(10).difference(Money.fromDecimal(10));
      expect(diff.isZero()).toBe(true);
    });
  });

  describe('Formatting', () => {
    it('formats with currency symbol', () => {
      const money = Money.fromDecimal(12.5);
      expect(money.format()).toBe('$12.50 MXN');
    });

    it('formats amount without currency', () => {
      const money = Money.fromDecimal(12.5);
      expect(money.formatAmount()).toBe('12.50');
    });

    it('formats zero', () => {
      const money = Money.zero();
      expect(money.format()).toBe('$0.00 MXN');
    });

    it('toString returns formatted string', () => {
      const money = Money.fromDecimal(25.99);
      expect(money.toString()).toBe('$25.99 MXN');
    });
  });

  describe('JSON Serialization / Deserialization', () => {
    it('serializes to JSON', () => {
      const money = Money.fromDecimal(42.5, 'MXN');
      const json = money.toJSON();
      expect(json).toEqual({ cents: 4250, currency: 'MXN' });
    });

    it('deserializes from JSON', () => {
      const money = Money.fromJSON({ cents: 4250, currency: 'MXN' });
      expect(money.cents).toBe(4250);
      expect(money.currency).toBe('MXN');
    });

    it('round-trips through JSON', () => {
      const original = Money.fromDecimal(99.99, 'USD');
      const restored = Money.fromJSON(original.toJSON());
      expect(original.equals(restored)).toBe(true);
    });
  });
});
