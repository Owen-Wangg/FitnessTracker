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
