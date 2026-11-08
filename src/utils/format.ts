// Shared display formatting, so every screen words numbers and dates the same way.
import { parseLocalDate } from './workoutMetrics';

// 1,234.5 (at most one decimal).
export const formatNumber = (n: number): string => n.toLocaleString(undefined, { maximumFractionDigits: 1 });

// "3 sets", "1 set".
export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? '' : 's'}`;

const dateText = (date: string, options: Intl.DateTimeFormatOptions): string =>
  parseLocalDate(date).toLocaleDateString('en-US', options);

// "Jun 1"
export const shortDate = (date: string): string => dateText(date, { month: 'short', day: 'numeric' });

// "Jun 1, 2025"
export const dateWithYear = (date: string): string => dateText(date, { month: 'short', day: 'numeric', year: 'numeric' });

// "Sun, Jun 1, 2025"
export const longDate = (date: string): string =>
  dateText(date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

// "1.3M", "12.5K", but plain "8,450" below ten thousand, where the exact figure is still short.
export const compactNumber = (n: number): string =>
  Math.abs(n) < 10_000
    ? n.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : n.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 });

// "Mar 2025"
export const monthYear = (date: string): string => dateText(date, { month: 'short', year: 'numeric' });
