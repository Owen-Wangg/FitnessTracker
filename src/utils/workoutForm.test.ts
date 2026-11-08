import { validateWorkoutForm } from './workoutForm';

const squat = { id: 'Barbell_Squat', name: 'Squat' };
const base = { exercise: squat, date: '2025-06-01', sets: [{ weight: '135', reps: '8' }] };

test('accepts a valid form and parses the numbers', () => {
  expect(validateWorkoutForm({ ...base, sets: [{ weight: '135.5', reps: '8' }, { weight: '0', reps: '12' }] })).toEqual({
    sets: [{ weight: 135.5, reps: 8 }, { weight: 0, reps: 12 }],
  });
});

test('requires an exercise and a date', () => {
  expect(validateWorkoutForm({ ...base, exercise: null }).error).toMatch(/exercise/i);
  expect(validateWorkoutForm({ ...base, date: '' }).error).toMatch(/date/i);
});

test('names the first bad set', () => {
  const result = validateWorkoutForm({ ...base, sets: [{ weight: '135', reps: '8' }, { weight: '', reps: '5' }] });
  expect(result.error).toMatch(/set 2/);
});

test('rejects zero reps and negative weight', () => {
  expect(validateWorkoutForm({ ...base, sets: [{ weight: '100', reps: '0' }] }).error).toMatch(/set 1/);
  expect(validateWorkoutForm({ ...base, sets: [{ weight: '-5', reps: '5' }] }).error).toMatch(/set 1/);
  expect(validateWorkoutForm({ ...base, sets: [{ weight: '100', reps: '' }] }).error).toMatch(/set 1/);
});

test('bodyweight exercises treat a blank weight as 0', () => {
  const pullUp = { id: 'Pull_Up', name: 'Pull-Up' };
  expect(validateWorkoutForm({ ...base, exercise: pullUp, sets: [{ weight: '', reps: '8' }, { weight: '25', reps: '5' }] })).toEqual({
    sets: [{ weight: 0, reps: 8 }, { weight: 25, reps: 5 }],
  });
  expect(validateWorkoutForm({ ...base, exercise: pullUp, sets: [{ weight: '', reps: '' }] }).error).toMatch(/set 1/);
});

test('keeps a set_type so editing does not erase warm-up or drop tags', () => {
  const result = validateWorkoutForm({
    ...base,
    sets: [{ weight: '45', reps: '10', set_type: 'warmup' }, { weight: '135', reps: '8' }],
  });
  expect(result.sets).toEqual([
    { weight: 45, reps: 10, set_type: 'warmup' },
    { weight: 135, reps: 8 },
  ]);
});
