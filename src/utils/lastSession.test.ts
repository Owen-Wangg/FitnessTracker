import { daysAgoText, describeSets, lastSession } from './lastSession';
import type { Workout, WorkoutSet } from '../types';

const entry = (id: string, date: string, sets: WorkoutSet[], extra: Partial<Workout> = {}): Workout => ({
  id,
  date,
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets,
  ...extra,
});

const press = { id: 'Leverage_Chest_Press', name: 'Flat Chest Press Machine' };

describe('lastSession', () => {
  const workouts = [
    entry('c', '2025-06-15', [{ weight: 200, reps: 5 }]),
    entry('b', '2025-06-08', [{ weight: 45, reps: 10, set_type: 'warmup' }, { weight: 190, reps: 5 }]),
    entry('a', '2025-06-01', [{ weight: 185, reps: 5 }]),
    entry('x', '2025-06-10', [{ weight: 300, reps: 5 }], { name: 'Leg Press Machine', exerciseId: 'Leg_Press' }),
  ];

  test('finds the most recent earlier session and leaves out warm-ups', () => {
    expect(lastSession(workouts, press, '2025-06-20')).toEqual({ date: '2025-06-15', sets: [{ weight: 200, reps: 5 }] });
    expect(lastSession(workouts, press, '2025-06-15')?.sets).toEqual([{ weight: 190, reps: 5 }]);
  });

  test('ignores the same day and later days, and other exercises', () => {
    expect(lastSession(workouts, press, '2025-06-01')).toBeNull();
    expect(lastSession(workouts, { id: null, name: 'Sled Push' }, '2025-06-20')).toBeNull();
  });

  test('matches by name when there is no id, and combines same-day entries', () => {
    const twice = [
      entry('1', '2025-06-01', [{ weight: 135, reps: 10 }], { exerciseId: null, name: 'flat chest press machine' }),
      entry('2', '2025-06-01', [{ weight: 185, reps: 5 }]),
    ];
    expect(lastSession(twice, press, '2025-06-02')?.sets).toHaveLength(2);
  });

  test('handles an empty history', () => {
    expect(lastSession([], press, '2025-06-02')).toBeNull();
    expect(lastSession(undefined, press, '2025-06-02')).toBeNull();
  });
});

describe('describeSets', () => {
  test('writes each set in gym shorthand, with units', () => {
    expect(describeSets([{ weight: 135, reps: 8 }, { weight: 140, reps: 6 }], false)).toEqual(['1 × 8 @ 135 lbs', '1 × 6 @ 140 lbs']);
  });

  test('combines repeated identical sets in a row, but not separated ones', () => {
    const sets = [{ weight: 135, reps: 8 }, { weight: 135, reps: 8 }, { weight: 135, reps: 8 }, { weight: 145, reps: 6 }, { weight: 135, reps: 8 }];
    expect(describeSets(sets, false)).toEqual(['3 × 8 @ 135 lbs', '1 × 6 @ 145 lbs', '1 × 8 @ 135 lbs']);
  });

  test('bodyweight sets show BW, with any added weight', () => {
    expect(describeSets([{ weight: 0, reps: 10 }, { weight: 0, reps: 10 }, { weight: 25, reps: 5 }], true)).toEqual([
      '2 × 10 @ BW',
      '1 × 5 @ BW + 25 lbs',
    ]);
  });

  test('uses the given formatter for weights', () => {
    expect(describeSets([{ weight: 100, reps: 5 }], false, (lbs) => `${lbs / 2} kg`)).toEqual(['1 × 5 @ 50 kg']);
  });

  test('is empty with no sets', () => {
    expect(describeSets([], false)).toEqual([]);
  });
});

describe('daysAgoText', () => {
  test('reads naturally', () => {
    expect(daysAgoText(0)).toBe('today');
    expect(daysAgoText(1)).toBe('yesterday');
    expect(daysAgoText(9)).toBe('9 days ago');
  });
});
