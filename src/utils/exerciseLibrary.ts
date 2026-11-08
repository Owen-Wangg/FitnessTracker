import { FUNDAMENTALS, GROUPS } from '../data/fundamentals';
import type { Exercise } from '../types';

// Just enough of a logged workout to identify its lift.
interface WorkoutIdentity {
  exerciseId?: string | null;
  name?: string | null;
}

export { FUNDAMENTALS, GROUPS };

// Thumbnails live in public/exercises (drawn by scripts/make-exercise-icons.ts), so they are served
// by the app itself: fast, cacheable, and no third-party host.
export const exerciseImageUrl = (exercise: Pick<Exercise, 'id'> | null | undefined): string | null =>
  exercise ? `${import.meta.env.BASE_URL}exercises/${exercise.id}.webp` : null;

const byId = new Map<string, Exercise>(FUNDAMENTALS.map((e) => [e.id, e]));
const byName = new Map<string, Exercise>(FUNDAMENTALS.map((e) => [e.name.toLowerCase(), e]));

// Library entry for a logged workout: by id, else by exact (case-insensitive) name for older entries.
// Returns null for an older entry that is not in the list.
export const findExercise = (exerciseId?: string | null, name?: string | null): Exercise | null =>
  (exerciseId && byId.get(exerciseId)) || (name && byName.get(name.trim().toLowerCase())) || null;

// True for library exercises done against body weight (pull-ups, push-ups...). Anything not in the list is treated as external.
export const isBodyweight = (exerciseId?: string | null, name?: string | null): boolean =>
  findExercise(exerciseId, name)?.loadType === 'bodyweight';

// Stable identity for grouping a lift across entries: the library id when the name or id matches
// a built-in exercise (so "bench press" and "Bench Press" are one lift), else the lowercased name.
export const exerciseKey = (workout: WorkoutIdentity): string => {
  const found = findExercise(workout.exerciseId, workout.name);
  return found ? found.id : (workout.name || '').trim().toLowerCase();
};

// Distinct exercises in a list of workouts as [{ key, label }], most recently logged first
// (assumes the list is newest first).
export const exerciseOptions = (workouts: (WorkoutIdentity | null | undefined)[] | null | undefined): { key: string; label: string }[] => {
  const seen = new Map<string, string>();
  (workouts || []).forEach((w) => {
    if (!w || !w.name) return;
    const key = exerciseKey(w);
    if (key && !seen.has(key)) {
      seen.set(key, findExercise(w.exerciseId, w.name)?.name || w.name.trim());
    }
  });
  return [...seen].map(([key, label]) => ({ key, label }));
};

export const searchExercises = (query: string): Exercise[] => {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return FUNDAMENTALS;
  return FUNDAMENTALS.filter((e) => {
    const haystack = `${e.name} ${e.group}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
};
