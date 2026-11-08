import {
  estimate1RM,
  setVolume,
  workoutVolume,
  totalVolume,
  topSet,
  bestEstimated1RM,
  bestReps,
  bodyWeightOn,
  applyBodyWeight,
  formatLocalDate,
  parseLocalDate,
} from './workoutMetrics';
import type { WorkoutSet } from '../types';

const workout = (sets: WorkoutSet[]) => ({ id: 'w', date: '2025-06-01', name: 'Bench Press', sets });

describe('estimate1RM', () => {
  test('a single rep is its own 1RM', () => {
    expect(estimate1RM(225, 1)).toBe(225);
  });

  test('uses the Epley formula for multiple reps', () => {
    expect(estimate1RM(200, 5)).toBeCloseTo(200 * (1 + 5 / 30));
  });

  test('returns 0 for missing or non-positive input', () => {
    expect(estimate1RM(0, 5)).toBe(0);
    expect(estimate1RM(100, 0)).toBe(0);
    expect(estimate1RM(undefined, undefined)).toBe(0);
  });
});

describe('volume', () => {
  test('setVolume is weight x reps and tolerates strings', () => {
    expect(setVolume({ weight: 135, reps: 8 })).toBe(1080);
    expect(setVolume({ weight: '135', reps: '8' } as never)).toBe(1080);
    expect(setVolume({ weight: null, reps: 8 } as never)).toBe(0);
  });

  test('workoutVolume sums sets with different weights', () => {
    const w = workout([
      { weight: 135, reps: 10 },
      { weight: 185, reps: 5 },
    ]);
    expect(workoutVolume(w)).toBe(1350 + 925);
  });

  test('warm-up sets are excluded', () => {
    const w = workout([
      { weight: 45, reps: 10, set_type: 'warmup' },
      { weight: 135, reps: 10, set_type: 'normal' },
    ]);
    expect(workoutVolume(w)).toBe(1350);
  });

  test('handles empty or missing sets', () => {
    expect(workoutVolume(workout([]))).toBe(0);
    expect(workoutVolume({})).toBe(0);
    expect(workoutVolume(null)).toBe(0);
  });

  test('totalVolume adds up workouts', () => {
    const list = [workout([{ weight: 100, reps: 10 }]), workout([{ weight: 50, reps: 10 }])];
    expect(totalVolume(list)).toBe(1500);
    expect(totalVolume(undefined)).toBe(0);
  });
});

describe('topSet and bestEstimated1RM', () => {
  test('topSet picks the heaviest set', () => {
    const w = workout([
      { weight: 135, reps: 10 },
      { weight: 205, reps: 3 },
      { weight: 185, reps: 5 },
    ]);
    expect(topSet(w)).toEqual({ weight: 205, reps: 3 });
  });

  test('topSet breaks weight ties with more reps', () => {
    const w = workout([
      { weight: 185, reps: 3 },
      { weight: 185, reps: 6 },
    ]);
    expect(topSet(w)).toEqual({ weight: 185, reps: 6 });
  });

  test('topSet ignores warm-ups and returns null with no counted sets', () => {
    expect(topSet(workout([{ weight: 300, reps: 1, set_type: 'warmup' }]))).toBeNull();
    expect(topSet(workout([]))).toBeNull();
  });

  test('bestEstimated1RM can favor a lighter, higher-rep set', () => {
    const w = workout([
      { weight: 200, reps: 1 }, // 200
      { weight: 185, reps: 8 }, // ~234
    ]);
    expect(bestEstimated1RM(w)).toBeCloseTo(185 * (1 + 8 / 30));
  });
});

describe('bodyweight exercises', () => {
  const bodyWeights = [
    { id: 'a', date: '2025-05-01', weight: 180 },
    { id: 'b', date: '2025-06-01', weight: 175 },
  ];
  const pullUps = (date: string, sets: WorkoutSet[]) => ({ id: date, date, name: 'Pull-Up', exerciseId: 'Pull_Up', sets });

  test('bodyWeightOn uses the latest entry on or before the date', () => {
    expect(bodyWeightOn('2025-05-20', bodyWeights)).toBe(180);
    expect(bodyWeightOn('2025-06-01', bodyWeights)).toBe(175);
    expect(bodyWeightOn('2025-07-01', bodyWeights)).toBe(175);
  });

  test('bodyWeightOn falls back to the earliest entry for earlier dates, and null with none', () => {
    expect(bodyWeightOn('2025-01-01', bodyWeights)).toBe(180);
    expect(bodyWeightOn('2025-01-01', [])).toBeNull();
    expect(bodyWeightOn('2025-01-01', undefined)).toBeNull();
  });

  test('applyBodyWeight sets load to body weight + added weight and leaves the logged weight alone', () => {
    const [w] = applyBodyWeight([pullUps('2025-06-10', [{ weight: 0, reps: 8 }, { weight: 25, reps: 5 }])], bodyWeights);
    expect(w.sets.map((s) => s.load)).toEqual([175, 200]);
    expect(w.sets.map((s) => s.weight)).toEqual([0, 25]);
  });

  test('applyBodyWeight with no body weight logged uses just the added weight', () => {
    const [w] = applyBodyWeight([pullUps('2025-06-10', [{ weight: 25, reps: 5 }])], []);
    expect(w.sets[0].load).toBe(25);
  });

  test('applyBodyWeight tags every workout with the body weight on its date, without touching external sets', () => {
    const bench = workout([{ weight: 135, reps: 8 }]); // dated 2025-06-01
    const [tagged] = applyBodyWeight([bench], bodyWeights);
    expect(tagged.bodyWeight).toBe(175);
    expect(tagged.sets).toBe(bench.sets);
  });

  test('applyBodyWeight returns a workout unchanged when no body weight is logged and none is needed', () => {
    const bench = workout([{ weight: 135, reps: 8 }]);
    expect(applyBodyWeight([bench], [])[0]).toBe(bench);
  });

  test('metrics use load in place of weight', () => {
    const [w] = applyBodyWeight([pullUps('2025-06-10', [{ weight: 0, reps: 10 }, { weight: 25, reps: 4 }])], bodyWeights);
    expect(workoutVolume(w)).toBe(175 * 10 + 200 * 4);
    expect(topSet(w)).toEqual({ weight: 200, reps: 4 });
    expect(bestEstimated1RM(w)).toBeCloseTo(Math.max(175 * (1 + 10 / 30), 200 * (1 + 4 / 30)));
  });

  test('bestReps is the most reps in one counted set', () => {
    expect(bestReps(workout([{ weight: 0, reps: 8 }, { weight: 0, reps: 12 }, { weight: 0, reps: 30, set_type: 'warmup' }]))).toBe(12);
    expect(bestReps(workout([]))).toBe(0);
  });
});

describe('dates', () => {
  test('formatLocalDate uses the local calendar day, zero-padded', () => {
    expect(formatLocalDate(new Date(2025, 0, 5, 23, 59))).toBe('2025-01-05');
    expect(formatLocalDate(new Date(2025, 11, 31, 0, 1))).toBe('2025-12-31');
  });

  test('parseLocalDate round-trips and ignores a time suffix', () => {
    const d = parseLocalDate('2025-06-01T12:00:00');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2025, 5, 1]);
    expect(formatLocalDate(parseLocalDate('2025-06-01'))).toBe('2025-06-01');
  });
});
