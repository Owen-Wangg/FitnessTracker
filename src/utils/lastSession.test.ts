import { describeSets, lastSession } from './lastSession';
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
  test('lists weight x reps', () => {
    expect(describeSets([{ weight: 135, reps: 8 }, { weight: 140, reps: 6 }], false)).toBe('135 × 8, 140 × 6');
  });

  test('bodyweight sets show BW, with any added weight', () => {
    expect(describeSets([{ weight: 0, reps: 10 }, { weight: 25, reps: 5 }], true)).toBe('BW × 10, BW+25 × 5');
  });

  test('uses the given formatter for weights', () => {
    expect(describeSets([{ weight: 100, reps: 5 }], false, (lbs) => `${lbs / 2}kg`)).toBe('50kg × 5');
  });
});
