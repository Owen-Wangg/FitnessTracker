// Shared workout math. A workout entry looks like:
//   { id, date: 'YYYY-MM-DD', name, sets: [{ weight, reps, set_type }] }
// Warm-up sets are excluded from every metric.

// A set's `load` (body weight + added weight, for bodyweight exercises) stands in for `weight` in the
// strength measures (top set, estimated 1RM, per-exercise volume). Totals and summaries count only
// `weight`, the weight actually lifted or added, so body weight never inflates them.
import type { BodyWeight, Workout, WorkoutSet } from '../types';
import { isBodyweight } from './exerciseLibrary';

type WithSets = { sets?: WorkoutSet[] } | null | undefined;

const countedSets = (workout: WithSets): WorkoutSet[] =>
  (workout?.sets || []).filter((s) => s && s.set_type !== 'warmup' && Number(s.reps) > 0);

export const loadOf = (set: Pick<WorkoutSet, 'weight' | 'load'>): number => Number(set.load ?? set.weight) || 0;

// Body weight to use for a date: the latest entry on or before it, else the earliest one after it,
// else null. `bodyWeights` is oldest first.
export const bodyWeightOn = (date: string, bodyWeights: BodyWeight[] | null | undefined): number | null => {
  const day = String(date).split('T')[0];
  let before: BodyWeight | null = null;
  for (const entry of bodyWeights || []) {
    if (entry.date <= day) before = entry;
    else return (before ?? entry).weight;
  }
  return before ? before.weight : null;
};

// Attaches body weight to workouts, in memory only:
//  - every workout gets `bodyWeight` (the body weight on its date) once any body weight is logged
//  - each set of a bodyweight exercise gets a `load` of body weight + added weight; with no body
//    weight logged yet the load is just the added weight
// Workouts that need neither are returned unchanged.
export const applyBodyWeight = (workouts: Workout[], bodyWeights: BodyWeight[] | null | undefined): Workout[] =>
  workouts.map((w) => {
    const bodyWeight = bodyWeightOn(w.date, bodyWeights);
    if (!isBodyweight(w.exerciseId, w.name)) return bodyWeight === null ? w : { ...w, bodyWeight };
    return {
      ...w,
      ...(bodyWeight === null ? {} : { bodyWeight }),
      sets: w.sets.map((s) => ({ ...s, load: (bodyWeight ?? 0) + (Number(s.weight) || 0) })),
    };
  });

// Epley estimated one-rep max. A single rep is its own 1RM.
export const estimate1RM = (weight: unknown, reps: unknown): number => {
  const w = Number(weight) || 0;
  const r = Number(reps) || 0;
  if (w <= 0 || r <= 0) return 0;
  return r === 1 ? w : w * (1 + r / 30);
};

// Weight lifted x reps. For bodyweight exercises that is the added weight only, so a pull-up with no
// belt counts 0; this is what totals and summaries use.
export const setVolume = (set: Pick<WorkoutSet, 'weight' | 'reps'>): number => (Number(set.weight) || 0) * (Number(set.reps) || 0);

export const workoutVolume = (workout: WithSets): number =>
  countedSets(workout).reduce((sum, s) => sum + setVolume(s), 0);

// Like workoutVolume but counting body weight for bodyweight exercises (the set's `load`). Used for one
// exercise's progress chart, where "pull-up volume including body weight" is the meaningful trend.
export const workoutLoadVolume = (workout: WithSets): number =>
  countedSets(workout).reduce((sum, s) => sum + loadOf(s) * (Number(s.reps) || 0), 0);

export const totalVolume = (workouts: WithSets[] | null | undefined): number =>
  (workouts || []).reduce((sum, w) => sum + workoutVolume(w), 0);

// Heaviest set (ties broken by more reps), or null if there are no counted sets. By default a bodyweight
// set counts with body weight (its load); pass false to compare only the weight actually lifted.
export const topSet = (workout: WithSets, includeBodyWeight = true): { weight: number; reps: number } | null =>
  countedSets(workout).reduce<{ weight: number; reps: number } | null>((best, s) => {
    const weight = includeBodyWeight ? loadOf(s) : Number(s.weight) || 0;
    const reps = Number(s.reps) || 0;
    if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
      return { weight, reps };
    }
    return best;
  }, null);

export const bestEstimated1RM = (workout: WithSets): number =>
  countedSets(workout).reduce((best, s) => Math.max(best, estimate1RM(loadOf(s), s.reps)), 0);

// Total reps across the counted sets.
export const workoutReps = (workout: WithSets): number =>
  countedSets(workout).reduce((sum, s) => sum + (Number(s.reps) || 0), 0);

// Most reps in a single counted set. The natural progress measure for bodyweight exercises.
export const bestReps = (workout: WithSets): number =>
  countedSets(workout).reduce((best, s) => Math.max(best, Number(s.reps) || 0), 0);

// 'YYYY-MM-DD' in the user's local timezone (toISOString would use UTC and can be off by a day).
export const formatLocalDate = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// The date n days after (or before, if negative) a 'YYYY-MM-DD' date.
export const addDays = (date: string, n: number): string => {
  const d = parseLocalDate(date);
  return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n));
};

// Monday of the week containing a 'YYYY-MM-DD' date (weeks run Monday to Sunday).
export const mondayOf = (date: string): string => addDays(date, -((parseLocalDate(date).getDay() + 6) % 7));

// Whole days from one 'YYYY-MM-DD' date to another (negative if `to` is earlier).
export const daysBetween = (from: string, to: string): number => {
  const utc = (date: string) => {
    const [y, m, d] = String(date).split('T')[0].split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((utc(to) - utc(from)) / (24 * 60 * 60 * 1000));
};

// Parse 'YYYY-MM-DD' as a local calendar date.
export const parseLocalDate = (dateString: string): Date => {
  const [y, m, d] = String(dateString).split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
};
