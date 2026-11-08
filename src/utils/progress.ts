import { topSet, bestEstimated1RM, bestReps, workoutVolume } from './workoutMetrics';
import { exerciseKey } from './exerciseLibrary';
import type { Metric, Workout } from '../types';

export interface DayPoint {
  date: string;
  top: { weight: number; reps: number } | null;
  e1rm: number;
  volume: number;
  reps: number; // most reps in one set
}

export type ScoredDay = DayPoint & { top: { weight: number; reps: number } };

// One point per calendar day for the chosen exercise, oldest first:
//   { date, top: { weight, reps }, e1rm, volume }
export const buildSeries = (workouts: Workout[] | null | undefined, key: string): ScoredDay[] => {
  const byDate: Record<string, DayPoint> = {};
  (workouts || [])
    .filter((w) => w && w.date && w.name && exerciseKey(w) === key)
    .forEach((w) => {
      const date = w.date.split('T')[0];
      const day = (byDate[date] = byDate[date] || { date, top: null, e1rm: 0, volume: 0, reps: 0 });
      const top = topSet(w);
      if (top && (!day.top || top.weight > day.top.weight || (top.weight === day.top.weight && top.reps > day.top.reps))) {
        day.top = top;
      }
      day.e1rm = Math.max(day.e1rm, bestEstimated1RM(w));
      day.reps = Math.max(day.reps, bestReps(w));
      day.volume += workoutVolume(w);
    });

  return (Object.values(byDate).filter((d) => d.top) as ScoredDay[])
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Time windows for the chart, counted back from the latest session (not from today), so a break
// from training never leaves an empty chart.
export type RangeKey = '1m' | '3m' | '6m' | 'all';
export const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: '1m', label: '1M', days: 30 },
  { key: '3m', label: '3M', days: 91 },
  { key: '6m', label: '6M', days: 182 },
  { key: 'all', label: 'All', days: Infinity },
];

const DAY_MS = 24 * 60 * 60 * 1000;
const dayNumber = (date: string): number => {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
};

// Days between the first and last point of a series (oldest first).
const spanDays = (days: { date: string }[]): number =>
  days.length < 2 ? 0 : dayNumber(days[days.length - 1].date) - dayNumber(days[0].date);

// Ranges worth offering: those shorter than the history. Empty when the history is short, because
// the choice would change nothing.
export const availableRanges = (days: { date: string }[]): RangeKey[] => {
  const span = spanDays(days);
  const shorter = RANGES.filter((r) => r.days < span).map((r) => r.key);
  return shorter.length > 0 ? [...shorter, 'all'] : [];
};

export const inRange = <T extends { date: string }>(days: T[], range: RangeKey): T[] => {
  const { days: window } = RANGES.find((r) => r.key === range) ?? RANGES[RANGES.length - 1];
  if (days.length === 0 || window === Infinity) return days;
  const cutoff = dayNumber(days[days.length - 1].date) - window;
  return days.filter((d) => dayNumber(d.date) >= cutoff);
};

// Least-squares line through the points (evenly spaced by position), as one fitted value per point.
// Null with fewer than three points, where a "trend" would just be a line between two dots.
export const trendLine = (values: number[]): number[] | null => {
  const n = values.length;
  if (n < 3) return null;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((sum, v) => sum + v, 0) / n;
  let covariance = 0;
  let variance = 0;
  values.forEach((v, i) => {
    covariance += (i - meanX) * (v - meanY);
    variance += (i - meanX) ** 2;
  });
  const slope = covariance / variance;
  return values.map((_, i) => meanY + slope * (i - meanX));
};

export const valueFor =(day: ScoredDay, metric: Metric): number => (metric === 'top' ? day.top.weight : day[metric]);

// A point is a PR when it beats everything before it. The first session is just the baseline.
export const personalRecordFlags = (values: number[]): boolean[] => {
  let runningMax = -Infinity;
  return values.map((v, i) => {
    const isPR = i > 0 && v > runningMax;
    runningMax = Math.max(runningMax, v);
    return isPR;
  });
};

// Round axis bounds and ticks to friendly numbers (170, 180, 190 rather than 171, 180.5, 189),
// with a little headroom above and below the data.
export const niceScale = (min: number, max: number, target = 4) => {
  const span = max - min;
  const headroom = span > 0 ? span * 0.1 : Math.abs(max) * 0.05 || 0.5;
  const lowRaw = min - headroom;
  const highRaw = max + headroom;
  const rawStep = (highRaw - lowRaw) / target;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = ([1, 2, 5, 10].find((m) => m * magnitude >= rawStep) ?? 10) * magnitude;
  const lo = Math.floor(lowRaw / step) * step;
  const hi = Math.ceil(highRaw / step) * step;
  const clean = (n: number) => Number(n.toFixed(6)); // drop floating-point noise like 0.30000000000000004
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(clean(v));
  return { domain: [clean(lo), clean(hi)] as [number, number], ticks };
};
