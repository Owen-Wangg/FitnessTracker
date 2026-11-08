// How your training divides across muscle groups, over a chosen period.
import { GROUPS, type Group, type Workout } from '../types';
import { daysBetween } from './workoutMetrics';
import { setsByGroup } from './weekSummary';

export type SplitRange = '30d' | '90d' | 'all';
export const SPLIT_RANGES: { key: SplitRange; label: string; days: number }[] = [
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
  { key: 'all', label: 'All time', days: Infinity },
];
export const DEFAULT_SPLIT_RANGE: SplitRange = '90d';

export interface GroupShare {
  group: Group;
  sets: number;
  percent: number; // whole number, share of all counted sets
}

export interface MuscleSplit {
  total: number; // working sets that belong to a muscle group
  shares: GroupShare[]; // one per group, in the usual order
}

// Working sets per muscle group over the last N days up to and including `today` ('YYYY-MM-DD'), or all time.
// Warm-ups and exercises without a group are left out. Workouts dated after `today` are ignored.
export const muscleSplit = (workouts: Workout[], range: SplitRange, today: string): MuscleSplit => {
  const { days } = SPLIT_RANGES.find((r) => r.key === range) ?? SPLIT_RANGES[SPLIT_RANGES.length - 1];
  const inPeriod = workouts.filter((w) => w.date <= today && daysBetween(w.date, today) < days);
  const counts = setsByGroup(inPeriod);
  const total = GROUPS.reduce((sum, g) => sum + counts[g], 0);

  return {
    total,
    shares: GROUPS.map((group) => ({
      group,
      sets: counts[group],
      percent: total > 0 ? Math.round((counts[group] / total) * 100) : 0,
    })),
  };
};
