/**
 * Tests for formatting utilities.
 */

import {
  formatCurrency,
  formatDate,
  formatDistance,
  formatDuration,
  formatRelativeTime,
} from '../../lib/format';

describe('formatCurrency', () => {
  it('should format MXN currency', () => {
    const result = formatCurrency(123.45, 'MXN');
    expect(result).toContain('123');
    expect(result).toContain('$');
  });

  it('should format zero', () => {
    const result = formatCurrency(0, 'MXN');
    expect(result).toContain('0');
  });

  it('should default to MXN', () => {
    const result = formatCurrency(50);
    expect(result).toContain('$');
  });

  it('should always show 2 decimal places', () => {
    const result = formatCurrency(10, 'MXN');
    expect(result).toContain('.00');
  });
});

describe('formatDate', () => {
  it('should format a date with day and year', () => {
    const date = new Date('2025-01-15T12:00:00');
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('2025');
  });
});

describe('formatDistance', () => {
  it('should format km for distances >= 1', () => {
    expect(formatDistance(3.5)).toBe('3.5 km');
  });

  it('should format meters for distances < 1', () => {
    expect(formatDistance(0.5)).toBe('500 m');
  });

  it('should format 0 km as 0 m', () => {
    expect(formatDistance(0)).toBe('0 m');
  });

  it('should handle small distances', () => {
    expect(formatDistance(0.001)).toBe('1 m');
  });

  it('should format large distances', () => {
    expect(formatDistance(100)).toBe('100.0 km');
  });
});

describe('formatDuration', () => {
  it('should format minutes only', () => {
    expect(formatDuration(45)).toBe('45 min');
  });

  it('should format hours only', () => {
    expect(formatDuration(120)).toBe('2h');
  });

  it('should format hours and minutes', () => {
    expect(formatDuration(90)).toBe('1h 30 min');
  });

  it('should handle 0 minutes', () => {
    expect(formatDuration(0)).toBe('0 min');
  });

  it('should handle negative as 0', () => {
    expect(formatDuration(-10)).toBe('0 min');
  });

  it('should round remaining minutes', () => {
    expect(formatDuration(61)).toBe('1h 1 min');
  });
});

describe('formatRelativeTime', () => {
  it('should return moment text for very recent times', () => {
    const now = new Date();
    const result = formatRelativeTime(now);
    expect(result).toBe('Hace un momento');
  });

  it('should return minutes for times within an hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo)).toBe('Hace 5 minutos');
  });

  it('should use singular for 1 minute', () => {
    const oneMinAgo = new Date(Date.now() - 1 * 60 * 1000);
    expect(formatRelativeTime(oneMinAgo)).toBe('Hace 1 minuto');
  });

  it('should return hours for times within a day', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeHoursAgo)).toBe('Hace 3 horas');
  });

  it('should use singular for 1 hour', () => {
    const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
    expect(formatRelativeTime(oneHourAgo)).toBe('Hace 1 hora');
  });

  it('should return Ayer for yesterday', () => {
    const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatRelativeTime(yesterday)).toBe('Ayer');
  });

  it('should return days for recent days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    expect(formatRelativeTime(threeDaysAgo)).toBe('Hace 3 d\u00edas');
  });

  it('should return formatted date for old dates', () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const result = formatRelativeTime(twoWeeksAgo);
    // Should be a formatted date, not "Hace X d\u00edas"
    expect(result).not.toContain('Hace');
  });
});
