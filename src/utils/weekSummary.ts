// Numbers for the weekly summary: sets per muscle group and personal records.
import { GROUPS, type Group, type Workout } from '../types';
import { buildSeries, personalRecordFlags } from './progress';
import { exerciseKey, findExercise } from './exerciseLibrary';
import { daysBetween } from './workoutMetrics';

export type GroupSets = Record<Group, number>;

// Working sets (warm-ups left out) per muscle group. Custom exercises have no group, so they are skipped.
export const setsByGroup = (workouts: Workout[]): GroupSets => {
  const counts = Object.fromEntries(GROUPS.map((g) => [g, 0])) as GroupSets;
  workouts.forEach((w) => {
    const group = findExercise(w.exerciseId, w.name)?.group;
    if (!group) return;
    counts[group] += w.sets.filter((s) => s.set_type !== 'warmup' && Number(s.reps) > 0).length;
  });
  return counts;
};

// How many personal records were set on the given dates. A record is a session that beats every
// earlier one for the same exercise: by estimated 1RM, or for bodyweight exercises by reps too.
// An exercise's first session is a baseline, never a record.
export const countPersonalRecords = (workouts: Workout[], dates: Set<string>): number => {
  const keys = new Set(workouts.filter((w) => dates.has(w.date)).map(exerciseKey));
  let records = 0;
  keys.forEach((key) => {
    const series = buildSeries(workouts, key);
    const sample = workouts.find((w) => exerciseKey(w) === key);
    const bodyweight = findExercise(sample?.exerciseId, sample?.name)?.loadType === 'bodyweight';
    const byStrength = personalRecordFlags(series.map((d) => d.e1rm));
    const byReps = bodyweight ? personalRecordFlags(series.map((d) => d.reps)) : [];
    series.forEach((day, i) => {
      if (dates.has(day.date) && (byStrength[i] || byReps[i])) records += 1;
    });
  });
  return records;
};

// Days since each muscle group was last trained, as of `today` ('YYYY-MM-DD'). Null for a group that
// has never been trained. Workouts dated after `today` are ignored.
export const daysSinceByGroup = (workouts: Workout[], today: string): Record<Group, number | null> => {
  const latest: Partial<Record<Group, string>> = {};
  workouts.forEach((w) => {
    const group = findExercise(w.exerciseId, w.name)?.group;
    if (!group || w.date > today) return;
    if (!latest[group] || w.date > (latest[group] as string)) latest[group] = w.date;
  });
  return Object.fromEntries(GROUPS.map((g) => [g, latest[g] ? daysBetween(latest[g] as string, today) : null])) as Record<
    Group,
    number | null
  >;
};
