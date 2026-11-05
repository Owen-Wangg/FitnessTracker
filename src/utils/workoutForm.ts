// Validates the add-exercise form. `sets` rows hold raw input strings: [{ weight: '135', reps: '8' }].
// A row may also carry a set_type (kept when editing so warm-up/drop tags are not lost).
// Returns { error } or { sets: [{ weight: number, reps: number, set_type? }] }.
import type { SetInput, WorkoutSet } from '../types';

interface WorkoutFormValues {
  exercise: { name: string; id?: string | null } | null;
  date: string;
  sets: SetInput[];
}

type WorkoutFormResult = { error: string; sets?: undefined } | { sets: WorkoutSet[]; error?: undefined };

export const validateWorkoutForm = ({ exercise, date, sets }: WorkoutFormValues): WorkoutFormResult => {
  if (!exercise) return { error: 'Choose an exercise.' };
  if (!date) return { error: 'Pick a date.' };

  const parsed = sets.map((s) => ({
    weight: s.weight === '' ? NaN : parseFloat(s.weight),
    reps: parseInt(s.reps, 10),
    ...(s.set_type ? { set_type: s.set_type } : {}),
  }));

  const bad = parsed.findIndex((s) => isNaN(s.weight) || s.weight < 0 || !(s.reps > 0));
  if (bad !== -1) {
    return { error: `Enter a weight and at least 1 rep for set ${bad + 1}.` };
  }
  return { sets: parsed };
};
