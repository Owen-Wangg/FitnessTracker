import { monthStats } from './monthSummary';
import type { Workout, WorkoutSet } from '../types';

const bench = (date: string, sets: WorkoutSet[]): Workout => ({
  id: date,
  date,
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets,
});
const one = (date: string, weight: number, reps = 10) => bench(date, [{ weight, reps }]);

describe('monthStats', () => {
  const today = '2025-06-11';

  test('counts days, sets and volume for this month up to today', () => {
    const stats = monthStats(
      [
        one('2025-06-02', 100), // 1,000
        bench('2025-06-02', [{ weight: 45, reps: 10, set_type: 'warmup' }, { weight: 100, reps: 5 }]), // 500, warm-up ignored
        one('2025-06-10', 110), // 1,100
        one('2025-06-20', 200), // after today: ignored
        one('2025-05-31', 90), // last month: not this month
      ],
      today
    );
    expect(stats.daysTrained).toBe(2);
    expect(stats.sets).toBe(3);
    expect(stats.volume).toBe(1000 + 500 + 1100);
  });

  test('compares with the same stretch of last month, not all of it', () => {
    const stats = monthStats([one('2025-05-05', 100), one('2025-05-11', 100), one('2025-05-12', 500), one('2025-04-30', 999)], today);
    expect(stats.lastMonthVolume).toBe(2000); // May 1-11 only
  });

  test('counts personal records set this month', () => {
    const stats = monthStats([one('2025-05-20', 100), one('2025-06-03', 120), one('2025-06-09', 120)], today);
    expect(stats.records).toBe(1);
  });

  test('looks back to December from January', () => {
    const stats = monthStats([one('2024-12-05', 100), one('2024-12-20', 100), one('2025-01-03', 100)], '2025-01-10');
    expect(stats.lastMonthVolume).toBe(1000); // Dec 1-10
    expect(stats.volume).toBe(1000);
  });

  test('covers all of a shorter previous month', () => {
    const stats = monthStats([one('2025-02-28', 100), one('2025-03-31', 100)], '2025-03-31');
    expect(stats.lastMonthVolume).toBe(1000);
    expect(stats.volume).toBe(1000);
  });

  test('is all zeros with nothing logged', () => {
    expect(monthStats([], today)).toEqual({ daysTrained: 0, sets: 0, volume: 0, lastMonthVolume: 0, records: 0 });
  });
});
