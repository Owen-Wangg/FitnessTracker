// Shared workout math. A workout entry looks like:
//   { id, date: 'YYYY-MM-DD', name, sets: [{ weight, reps, set_type }] }
// Warm-up sets are excluded from every metric.

import type { WorkoutSet } from '../types';

type WithSets = { sets?: WorkoutSet[] } | null | undefined;

const countedSets = (workout: WithSets): WorkoutSet[] =>
  (workout?.sets || []).filter((s) => s && s.set_type !== 'warmup' && Number(s.reps) > 0);

// Epley estimated one-rep max. A single rep is its own 1RM.
export const estimate1RM = (weight: unknown, reps: unknown): number => {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  return r === 1 ? w : w * (1 + r / 30);
};

export const setVolume = (set: Pick<WorkoutSet, 'weight' | 'reps'>): number => (Number(set.weight) || 0) * (Number(set.reps) || 0);

export const workoutVolume = (workout: WithSets): number =>
  countedSets(workout).reduce((sum, s) => sum + setVolume(s), 0);

export const totalVolume = (workouts: WithSets[] | null | undefined): number =>
  (workouts || []).reduce((sum, w) => sum + workoutVolume(w), 0);

// Heaviest set (ties broken by more reps), or null if there are no counted sets.
export const topSet = (workout: WithSets): { weight: number; reps: number } | null =>
  countedSets(workout).reduce<{ weight: number; reps: number } | null>((best, s) => {
    const weight = Number(s.weight) || 0;
    const reps = Number(s.reps) || 0;
    if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
      return { weight, reps };
    }
    return best;
  }, null);

export const bestEstimated1RM = (workout: WithSets): number =>
  countedSets(workout).reduce((best, s) => Math.max(best, estimate1RM(s.weight, s.reps)), 0);

// 'YYYY-MM-DD' in the user's local timezone (toISOString would use UTC and can be off by a day).
export const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Parse 'YYYY-MM-DD' as a local calendar date.
export const parseLocalDate = (dateString: string): Date => {
  const [y, m, d] = String(dateString).split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};
