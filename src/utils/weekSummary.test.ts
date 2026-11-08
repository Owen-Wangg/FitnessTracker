import { countPersonalRecords, setsByGroup } from './weekSummary';
import type { Workout, WorkoutSet } from '../types';

const entry = (date: string, exerciseId: string | null, name: string, sets: WorkoutSet[]): Workout => ({
  id: `${date}-${name}`,
  date,
  name,
  exerciseId,
  sets,
});
const press = (date: string, weight: number, reps = 5) => entry(date, 'Leverage_Chest_Press', 'Flat Chest Press Machine', [{ weight, reps }]);
const pullUp = (date: string, reps: number, weight = 0) => entry(date, 'Pull_Up', 'Pull-Up', [{ weight, reps }]);

describe('setsByGroup', () => {
  test('counts working sets per group and leaves warm-ups out', () => {
    const counts = setsByGroup([
      entry('2025-06-09', 'Leverage_Chest_Press', 'Flat Chest Press Machine', [
        { weight: 45, reps: 10, set_type: 'warmup' },
        { weight: 185, reps: 5 },
        { weight: 185, reps: 5 },
      ]),
      entry('2025-06-10', 'Leg_Press', 'Leg Press Machine', [{ weight: 300, reps: 8 }]),
    ]);
    expect(counts).toEqual({ Chest: 2, Back: 0, Shoulders: 0, Arms: 0, Legs: 1, Core: 0 });
  });

  test('skips custom exercises, which have no group', () => {
    const counts = setsByGroup([entry('2025-06-09', null, 'Sled Push', [{ weight: 90, reps: 4 }])]);
    expect(Object.values(counts).every((n) => n === 0)).toBe(true);
  });

  test('is all zeros for no workouts', () => {
    expect(Object.values(setsByGroup([])).reduce((a, b) => a + b, 0)).toBe(0);
  });
});

describe('countPersonalRecords', () => {
  const week = new Set(['2025-06-09', '2025-06-10']);

  test('counts a session that beats every earlier one', () => {
    expect(countPersonalRecords([press('2025-06-02', 185), press('2025-06-09', 195)], week)).toBe(1);
  });

  test('a first session is a baseline, not a record', () => {
    expect(countPersonalRecords([press('2025-06-09', 195)], week)).toBe(0);
  });

  test('matching or missing the best is not a record', () => {
    expect(countPersonalRecords([press('2025-06-02', 195), press('2025-06-09', 195)], week)).toBe(0);
    expect(countPersonalRecords([press('2025-06-02', 205), press('2025-06-09', 195)], week)).toBe(0);
  });

  test('a record set earlier than the given dates is not counted', () => {
    expect(countPersonalRecords([press('2025-06-02', 185), press('2025-06-04', 195)], week)).toBe(0);
  });

  test('counts each exercise separately', () => {
    const legs = (date: string, weight: number) => entry(date, 'Leg_Press', 'Leg Press Machine', [{ weight, reps: 8 }]);
    const all = [press('2025-06-02', 185), legs('2025-06-02', 300), press('2025-06-09', 195), legs('2025-06-10', 310)];
    expect(countPersonalRecords(all, week)).toBe(2);
  });

  test('bodyweight exercises can set a record with more reps', () => {
    expect(countPersonalRecords([pullUp('2025-06-02', 8), pullUp('2025-06-09', 10)], week)).toBe(1);
    expect(countPersonalRecords([pullUp('2025-06-02', 10), pullUp('2025-06-09', 8)], week)).toBe(0);
  });
});
