// Personal records: the best set ever logged for each exercise.
import { estimate1RM, loadOf } from './workoutMetrics';
import { exerciseKey, findExercise } from './exerciseLibrary';
import type { Workout } from '../types';

export interface PersonalRecord {
  key: string; // same grouping key as the progress chart
  exerciseId: string | null;
  name: string;
  bodyweight: boolean;
  date: string; // when the best set was first reached
  weight: number; // pounds as logged: the weight lifted, or the added weight for bodyweight exercises
  reps: number;
  e1rm: number; // estimated one-rep max in pounds; 0 for bodyweight exercises
}

interface Candidate {
  record: PersonalRecord;
  score: number;
  tiebreak: number;
}

// "Best" means the highest estimated 1RM, or for bodyweight exercises the most reps in a set. Ties go
// to the heavier set, then to the earlier date, so a record is dated when it was first set.
// Warm-ups are ignored. Sorted most recently set first.
export const personalRecords = (workouts: Workout[]): PersonalRecord[] => {
  const best = new Map<string, Candidate>();

  workouts.forEach((w) => {
    const entry = findExercise(w.exerciseId, w.name);
    const bodyweight = entry?.loadType === 'bodyweight';
    const key = exerciseKey(w);
    if (!key) return;

    w.sets.forEach((s) => {
      const reps = Number(s.reps) || 0;
      if (s.set_type === 'warmup' || reps <= 0) return;
      const load = loadOf(s);
      const e1rm = estimate1RM(load, reps);
      const score = bodyweight ? reps : e1rm;
      if (score <= 0) return;
      const tiebreak = bodyweight ? Number(s.weight) || 0 : load;

      const current = best.get(key);
      const better =
        !current ||
        score > current.score ||
        (score === current.score && (tiebreak > current.tiebreak || (tiebreak === current.tiebreak && w.date < current.record.date)));
      if (better) {
        best.set(key, {
          record: {
            key,
            exerciseId: entry?.id ?? null,
            name: entry?.name ?? w.name.trim(),
            bodyweight,
            date: w.date,
            weight: Number(s.weight) || 0,
            reps,
            e1rm: bodyweight ? 0 : e1rm,
          },
          score,
          tiebreak,
        });
      }
    });
  });

  return [...best.values()]
    .map((c) => c.record)
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
};
