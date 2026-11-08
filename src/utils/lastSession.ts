// "Last time" for an exercise: the sets from its most recent session before a given date.
import { exerciseKey } from './exerciseLibrary';
import type { Workout, WorkoutSet } from '../types';

export interface LastSession {
  date: string;
  sets: WorkoutSet[]; // warm-ups left out
}

// `workouts` can be in any order. Entries for the same lift on the same day are combined.
export const lastSession = (
  workouts: Workout[] | null | undefined,
  exercise: { id?: string | null; name: string },
  beforeDate: string
): LastSession | null => {
  const key = exerciseKey({ exerciseId: exercise.id, name: exercise.name });
  const matches = (workouts || []).filter((w) => w.date < beforeDate && exerciseKey(w) === key);
  if (matches.length === 0) return null;

  const date = matches.reduce((latest, w) => (w.date > latest ? w.date : latest), matches[0].date);
  const sets = matches
    .filter((w) => w.date === date)
    .flatMap((w) => w.sets)
    .filter((s) => s.set_type !== 'warmup');
  return sets.length > 0 ? { date, sets } : null;
};

// "135 x 8, 135 x 7". Bodyweight sets read "BW x 10" or "BW+25 x 5". Pass a function to show weights
// in another unit; it receives pounds and returns the text.
export const describeSets = (
  sets: WorkoutSet[],
  bodyweight: boolean,
  formatWeight: (lbs: number) => string = String
): string =>
  sets
    .map((s) => {
      const added = Number(s.weight) || 0;
      const load = bodyweight ? (added > 0 ? `BW+${formatWeight(added)}` : 'BW') : formatWeight(added);
      return `${load} × ${s.reps}`;
    })
    .join(', ');
