import { normalizeWorkout, normalizeBodyWeight, sortNewestFirst, sortOldestFirst } from './workoutData';

test('normalizeWorkout orders sets, converts weight to a number and maps exercise_id', () => {
  const row = { id: 'w1', date: '2025-06-01', name: 'Squat', exercise_id: 'Barbell_Squat' };
  const sets = [
    { id: 's2', set_number: 2, weight: '185.50', reps: 5, set_type: 'normal' },
    { id: 's1', set_number: 1, weight: '135', reps: 8, set_type: 'normal' },
  ];
  const w = normalizeWorkout(row, sets);
  expect(w.exerciseId).toBe('Barbell_Squat');
  expect(w.sets.map((s) => s.id)).toEqual(['s1', 's2']);
  expect(w.sets.map((s) => s.weight)).toEqual([135, 185.5]);
});

test('normalizeWorkout tolerates missing sets and a missing exercise_id', () => {
  const w = normalizeWorkout({ id: 'w', date: '2025-06-01', name: 'Sled Push' }, undefined);
  expect(w.sets).toEqual([]);
  expect(w.exerciseId).toBeNull();
});

test('sorting does not mutate its input', () => {
  const list = [{ date: '2025-01-02' }, { date: '2025-01-03' }, { date: '2025-01-01' }];
  expect(sortNewestFirst(list).map((x) => x.date)).toEqual(['2025-01-03', '2025-01-02', '2025-01-01']);
  expect(sortOldestFirst(list).map((x) => x.date)).toEqual(['2025-01-01', '2025-01-02', '2025-01-03']);
  expect(list[0].date).toBe('2025-01-02');
});

test('normalizeBodyWeight converts weight to a number', () => {
  expect(normalizeBodyWeight({ id: 'b', date: '2025-06-01', weight: '178.5' }).weight).toBe(178.5);
});
