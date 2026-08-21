/**
 * Tests for input validators.
 */

import {
  isValidEmail,
  isValidPassword,
  sanitizeInput,
  isValidLocation,
} from '../../lib/validators';

describe('isValidEmail', () => {
  it('should accept valid email addresses', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('test.user@domain.co')).toBe(true);
    expect(isValidEmail('name+tag@company.org')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('')).toBe(false);
    expect(isValidEmail('notanemail')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('should trim whitespace', () => {
    expect(isValidEmail('  user@example.com  ')).toBe(true);
  });
});

describe('isValidPassword', () => {
  it('should accept strong passwords', () => {
    expect(isValidPassword('Password1')).toBe(true);
    expect(isValidPassword('MyStr0ngPass')).toBe(true);
    expect(isValidPassword('Abcdefg1')).toBe(true);
  });

  it('should reject short passwords', () => {
    expect(isValidPassword('Ab1')).toBe(false);
    expect(isValidPassword('Pass1')).toBe(false);
  });

  it('should reject passwords without uppercase', () => {
    expect(isValidPassword('lowercase1')).toBe(false);
  });

  it('should reject passwords without lowercase', () => {
    expect(isValidPassword('UPPERCASE1')).toBe(false);
  });

  it('should reject passwords without numbers', () => {
    expect(isValidPassword('NoNumbers')).toBe(false);
  });
});

describe('sanitizeInput', () => {
  it('should escape HTML angle brackets', () => {
    expect(sanitizeInput('<script>alert("xss")</script>')).toContain('&lt;');
    expect(sanitizeInput('<script>alert("xss")</script>')).not.toContain('<script>');
  });

  it('should escape double quotes', () => {
    expect(sanitizeInput('say "hello"')).toContain('&quot;');
  });

  it('should escape single quotes', () => {
    expect(sanitizeInput("it's")).toContain('&#x27;');
  });

  it('should escape forward slashes', () => {
    expect(sanitizeInput('path/to/file')).toContain('&#x2F;');
  });

  it('should trim whitespace', () => {
    expect(sanitizeInput('  hello  ')).toBe('hello');
  });

  it('should handle clean input unchanged (except trim)', () => {
    expect(sanitizeInput('normal text')).toBe('normal text');
  });
});

describe('isValidLocation', () => {
  it('should accept valid coordinates', () => {
    expect(isValidLocation(19.4326, -99.1332)).toBe(true); // CDMX
    expect(isValidLocation(0, 0)).toBe(true);
    expect(isValidLocation(-90, -180)).toBe(true);
    expect(isValidLocation(90, 180)).toBe(true);
  });

  it('should reject invalid latitude', () => {
    expect(isValidLocation(-91, 0)).toBe(false);
    expect(isValidLocation(91, 0)).toBe(false);
  });

  it('should reject invalid longitude', () => {
    expect(isValidLocation(0, -181)).toBe(false);
    expect(isValidLocation(0, 181)).toBe(false);
  });

  it('should reject NaN', () => {
    expect(isValidLocation(NaN, 0)).toBe(false);
    expect(isValidLocation(0, NaN)).toBe(false);
  });

  it('should reject Infinity', () => {
    expect(isValidLocation(Infinity, 0)).toBe(false);
    expect(isValidLocation(0, Infinity)).toBe(false);
  });
});
