import { topSet, bestEstimated1RM, workoutVolume } from './workoutMetrics';
import { exerciseKey } from './exerciseLibrary';
import type { Metric, Workout } from '../types';

export interface DayPoint {
  date: string;
  top: { weight: number; reps: number } | null;
  e1rm: number;
  volume: number;
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
      const day = (byDate[date] = byDate[date] || { date, top: null, e1rm: 0, volume: 0 });
      const top = topSet(w);
      if (top && (!day.top || top.weight > day.top.weight || (top.weight === day.top.weight && top.reps > day.top.reps))) {
        day.top = top;
      }
      day.e1rm = Math.max(day.e1rm, bestEstimated1RM(w));
      day.volume += workoutVolume(w);
    });

  return (Object.values(byDate).filter((d) => d.top) as ScoredDay[])
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const valueFor = (day: ScoredDay, metric: Metric): number => (metric === 'top' ? day.top.weight : day[metric]);

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
