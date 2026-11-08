import { lifetimeStats } from './lifetime';
import type { Workout, WorkoutSet } from '../types';

const log = (date: string, sets: WorkoutSet[], extra: Partial<Workout> = {}): Workout => ({
  id: `${date}-${Math.random()}`,
  date,
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets,
  ...extra,
});

test('adds up days, sets, volume and the first date', () => {
  const stats = lifetimeStats([
    log('2025-06-10', [{ weight: 100, reps: 10 }, { weight: 100, reps: 8 }]),
    log('2025-06-10', [{ weight: 50, reps: 10 }], { name: 'Leg Press Machine', exerciseId: 'Leg_Press' }),
    log('2025-05-02', [{ weight: 200, reps: 5 }]),
  ]);
  expect(stats).toEqual({ daysTrained: 2, sets: 4, volume: 1000 + 800 + 500 + 1000, firstDate: '2025-05-02' });
});

test('counts several workouts on one day as one day', () => {
  const stats = lifetimeStats([log('2025-06-10', [{ weight: 1, reps: 1 }]), log('2025-06-10', [{ weight: 1, reps: 1 }])]);
  expect(stats.daysTrained).toBe(1);
});

test('leaves out warm-ups, and body weight on bodyweight exercises', () => {
  const stats = lifetimeStats([
    log('2025-06-10', [{ weight: 45, reps: 10, set_type: 'warmup' }, { weight: 100, reps: 5 }]),
    log('2025-06-11', [{ weight: 0, reps: 10, load: 180 }], { name: 'Pull-Up', exerciseId: 'Pull_Up' }),
  ]);
  expect(stats.sets).toBe(2);
  expect(stats.volume).toBe(500); // the pull-ups add nothing
});

test('is empty with nothing logged', () => {
  expect(lifetimeStats([])).toEqual({ daysTrained: 0, sets: 0, volume: 0, firstDate: null });
});
