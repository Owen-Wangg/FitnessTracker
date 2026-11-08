import { DEFAULT_GOAL, GOAL_KEY, consistency, readGoal, saveGoal } from './consistency';
import type { Workout } from '../types';

// Wednesday 11 June 2025. Weeks (Mon-Sun) start Jun 9, Jun 2, May 26, May 19, May 12, ...
const today = '2025-06-11';
const on = (...dates: string[]): Workout[] =>
  dates.map((date, i) => ({ id: `${date}-${i}`, date, name: 'Flat Chest Press Machine', exerciseId: 'Leverage_Chest_Press', sets: [{ weight: 100, reps: 5 }] }));

describe('streak', () => {
  test('counts weeks in a row that met the goal, ending last week while this one is in progress', () => {
    const workouts = on(
      '2025-05-19', '2025-05-20', // 2 days: misses a goal of 3
      '2025-05-26', '2025-05-27', '2025-05-29', // 3
      '2025-06-02', '2025-06-03', '2025-06-05', // 3
      '2025-06-09', '2025-06-10' // this week, 2 so far
    );
    const result = consistency(workouts, 3, today);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
    expect(result.thisWeekDays).toBe(2);
    expect(result.goalMetThisWeek).toBe(false);
  });

  test('this week adds to the streak once it meets the goal', () => {
    const workouts = on('2025-06-02', '2025-06-03', '2025-06-05', '2025-06-09', '2025-06-10', '2025-06-11');
    const result = consistency(workouts, 3, today);
    expect(result.currentStreak).toBe(2);
    expect(result.goalMetThisWeek).toBe(true);
  });

  test('a week below the goal breaks it', () => {
    const workouts = on('2025-05-26', '2025-05-27', '2025-05-29', '2025-06-02', '2025-06-09', '2025-06-10', '2025-06-11');
    const result = consistency(workouts, 3, today);
    expect(result.currentStreak).toBe(1); // this week met it, last week did not
  });

  test('an empty week in the middle breaks it, and the longest run is remembered', () => {
    const run = on('2025-04-14', '2025-04-15', '2025-04-16', '2025-04-21', '2025-04-22', '2025-04-23', '2025-04-28', '2025-04-29', '2025-04-30');
    const recent = on('2025-06-02', '2025-06-03', '2025-06-04');
    const result = consistency([...run, ...recent], 3, today);
    expect(result.longestStreak).toBe(3);
    expect(result.currentStreak).toBe(1);
  });

  test('is zero when last week missed the goal, however long the run before it', () => {
    const workouts = on('2025-05-19', '2025-05-20', '2025-05-21', '2025-05-26', '2025-05-27', '2025-05-28', '2025-06-02');
    const result = consistency(workouts, 3, today);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(2);
  });

  test('a lower goal gives a longer streak', () => {
    const workouts = on('2025-05-26', '2025-05-27', '2025-06-02', '2025-06-03', '2025-06-09', '2025-06-10');
    expect(consistency(workouts, 2, today).currentStreak).toBe(3);
    expect(consistency(workouts, 3, today).currentStreak).toBe(0);
  });

  test('several workouts on one day count as one day', () => {
    const workouts = on('2025-06-02', '2025-06-02', '2025-06-02', '2025-06-03');
    expect(consistency(workouts, 3, today).currentStreak).toBe(0);
    expect(consistency(workouts, 2, today).currentStreak).toBe(1);
  });

  test('Sunday belongs to the week that began on the Monday before it', () => {
    const workouts = on('2025-06-02', '2025-06-03', '2025-06-08'); // Sunday Jun 8 ends the week of Jun 2
    expect(consistency(workouts, 3, today).currentStreak).toBe(1);
  });
});

describe('weekly average', () => {
  test('averages finished weeks, including empty ones', () => {
    // weeks: May 19 = 2, May 26 = 0, Jun 2 = 3 -> 5 / 3
    const workouts = on('2025-05-19', '2025-05-20', '2025-06-02', '2025-06-03', '2025-06-05', '2025-06-09');
    const result = consistency(workouts, 3, today);
    expect(result.averagePerWeek).toBeCloseTo(5 / 3);
    expect(result.weeksCounted).toBe(3);
  });

  test('uses only the last eight finished weeks', () => {
    const old = on('2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10'); // 5 days, long ago
    const recent = on('2025-04-21', '2025-05-26', '2025-06-02'); // the 8 finished weeks hold 3 days
    const result = consistency([...old, ...recent], 3, today);
    expect(result.weeksCounted).toBe(8);
    expect(result.averagePerWeek).toBeCloseTo(3 / 8);
  });

  test('is null before the first week has finished', () => {
    const result = consistency(on('2025-06-09', '2025-06-10'), 3, today);
    expect(result.averagePerWeek).toBeNull();
    expect(result.weeksCounted).toBe(0);
    expect(result.thisWeekDays).toBe(2);
  });
});

describe('edge cases', () => {
  test('is all zeros with nothing logged', () => {
    expect(consistency([], 3, today)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      thisWeekDays: 0,
      goalMetThisWeek: false,
      averagePerWeek: null,
      weeksCounted: 0,
    });
  });

  test('ignores workouts dated in the future', () => {
    const result = consistency(on('2025-06-20', '2025-06-21', '2025-06-22'), 3, today);
    expect(result.currentStreak).toBe(0);
    expect(result.thisWeekDays).toBe(0);
  });
});

describe('saved goal', () => {
  const storage = (value: string | null) => ({ getItem: () => value, setItem: vi.fn() });

  test('defaults when missing, unknown or blocked', () => {
    expect(readGoal(storage(null))).toBe(DEFAULT_GOAL);
    expect(readGoal(storage('9'))).toBe(DEFAULT_GOAL);
    expect(readGoal(storage('abc'))).toBe(DEFAULT_GOAL);
    expect(readGoal({ getItem: () => { throw new Error('blocked'); } })).toBe(DEFAULT_GOAL);
  });

  test('reads a valid goal back and saves under its key', () => {
    expect(readGoal(storage('4'))).toBe(4);
    const s = storage(null);
    saveGoal(s, 5);
    expect(s.setItem).toHaveBeenCalledWith(GOAL_KEY, '5');
  });
});
