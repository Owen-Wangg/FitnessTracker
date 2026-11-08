import { compactNumber, dateWithYear, formatNumber, longDate, monthYear, plural, shortDate } from './format';

describe('formatNumber', () => {
  test('groups thousands and keeps at most one decimal', () => {
    expect(formatNumber(1234.56)).toBe('1,234.6');
    expect(formatNumber(1000)).toBe('1,000');
    expect(formatNumber(0.25)).toBe('0.3');
    expect(formatNumber(-3)).toBe('-3');
  });
});

describe('plural', () => {
  test('adds an s except for exactly one', () => {
    expect(plural(1, 'week')).toBe('1 week');
    expect(plural(0, 'week')).toBe('0 weeks');
    expect(plural(3, 'set')).toBe('3 sets');
  });
});

describe('dates', () => {
  test('use the local calendar day, whatever the time zone', () => {
    expect(shortDate('2025-06-01')).toBe('Jun 1');
    expect(dateWithYear('2025-06-01')).toBe('Jun 1, 2025');
    expect(longDate('2025-06-01')).toBe('Sun, Jun 1, 2025');
  });

  test('ignore a time suffix', () => {
    expect(shortDate('2025-12-31T23:59:00')).toBe('Dec 31');
  });
});

describe('compactNumber', () => {
  test('keeps small numbers exact and shortens big ones', () => {
    expect(compactNumber(0)).toBe('0');
    expect(compactNumber(8450)).toBe('8,450');
    expect(compactNumber(9999.4)).toBe('9,999');
    expect(compactNumber(10000)).toBe('10K');
    expect(compactNumber(12500)).toBe('12.5K');
    expect(compactNumber(1_284_300)).toBe('1.3M');
  });
});

describe('monthYear', () => {
  test('names the month and year', () => {
    expect(monthYear('2025-03-14')).toBe('Mar 2025');
  });
});
