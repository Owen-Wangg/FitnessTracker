// Validates the add-exercise form. `sets` rows hold raw input strings: [{ weight: '135', reps: '8' }].
// Returns { error } or { sets: [{ weight: number, reps: number }] }.
export const validateWorkoutForm = ({ exercise, date, sets }) => {
  if (!exercise) return { error: 'Choose an exercise.' };
  if (!date) return { error: 'Pick a date.' };

  const parsed = sets.map((s) => ({
    weight: s.weight === '' ? NaN : parseFloat(s.weight),
    reps: parseInt(s.reps, 10),
  }));

  const bad = parsed.findIndex((s) => isNaN(s.weight) || s.weight < 0 || !(s.reps > 0));
  if (bad !== -1) {
    return { error: `Enter a weight and at least 1 rep for set ${bad + 1}.` };
  }
  return { sets: parsed };
};
