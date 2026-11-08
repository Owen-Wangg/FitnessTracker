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

// Sets as short phrases in gym shorthand, repeated identical sets combined: "3 × 8 @ 135 lbs".
// Bodyweight sets read "3 × 10 @ BW" or "1 × 5 @ BW + 25 lbs". `formatWeight` turns pounds into text with
// its unit, which lets the caller choose lbs or kg.
export const describeSets = (
  sets: WorkoutSet[],
  bodyweight: boolean,
  formatWeight: (lbs: number) => string = (lbs) => `${lbs} lbs`
): string[] => {
  const groups: { count: number; reps: number; weight: number }[] = [];
  sets.forEach((s) => {
    const weight = Number(s.weight) || 0;
    const reps = Number(s.reps) || 0;
    const previous = groups[groups.length - 1];
    if (previous && previous.weight === weight && previous.reps === reps) previous.count += 1;
    else groups.push({ count: 1, reps, weight });
  });

  return groups.map(({ count, reps, weight }) => {
    const load = bodyweight ? (weight > 0 ? `BW + ${formatWeight(weight)}` : 'BW') : formatWeight(weight);
    return `${count} × ${reps} @ ${load}`;
  });
};

// "today", "yesterday" or "9 days ago".
export const daysAgoText = (days: number): string =>
  days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
