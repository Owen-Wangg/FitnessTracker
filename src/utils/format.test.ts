import { dateWithYear, formatNumber, longDate, plural, shortDate } from './format';

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
