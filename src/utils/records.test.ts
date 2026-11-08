import { personalRecords } from './records';
import type { Workout, WorkoutSet } from '../types';

const press = (date: string, sets: WorkoutSet[]): Workout => ({
  id: `${date}-press`,
  date,
  name: 'Flat Chest Press Machine',
  exerciseId: 'Leverage_Chest_Press',
  sets,
});
const pullUp = (date: string, sets: WorkoutSet[]): Workout => ({ id: `${date}-pu`, date, name: 'Pull-Up', exerciseId: 'Pull_Up', sets });

describe('personalRecords', () => {
  test('picks the set with the best estimated 1RM, not simply the heaviest', () => {
    const [record] = personalRecords([press('2025-06-01', [{ weight: 200, reps: 1 }, { weight: 185, reps: 8 }])]);
    expect(record).toMatchObject({ name: 'Flat Chest Press Machine', weight: 185, reps: 8, date: '2025-06-01' });
    expect(record.e1rm).toBeCloseTo(185 * (1 + 8 / 30));
  });

  test('looks across every session and keeps the date of the best one', () => {
    const records = personalRecords([
      press('2025-06-15', [{ weight: 190, reps: 5 }]),
      press('2025-06-01', [{ weight: 195, reps: 5 }]),
      press('2025-06-08', [{ weight: 185, reps: 5 }]),
    ]);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ weight: 195, date: '2025-06-01' });
  });

  test('a tie is dated when it was first reached', () => {
    const records = personalRecords([press('2025-06-15', [{ weight: 195, reps: 5 }]), press('2025-06-01', [{ weight: 195, reps: 5 }])]);
    expect(records[0].date).toBe('2025-06-01');
  });

  test('ignores warm-ups and sets with no weight or no reps', () => {
    const records = personalRecords([
      press('2025-06-01', [
        { weight: 300, reps: 1, set_type: 'warmup' },
        { weight: 0, reps: 10 },
        { weight: 100, reps: 0 },
        { weight: 135, reps: 5 },
      ]),
    ]);
    expect(records[0]).toMatchObject({ weight: 135, reps: 5 });
  });

  test('bodyweight exercises are judged by reps, then by added weight', () => {
    const [record] = personalRecords([
      pullUp('2025-06-01', [{ weight: 0, reps: 10 }]),
      pullUp('2025-06-08', [{ weight: 25, reps: 10 }]),
      pullUp('2025-06-15', [{ weight: 0, reps: 9 }]),
    ]);
    expect(record).toMatchObject({ bodyweight: true, reps: 10, weight: 25, date: '2025-06-08', e1rm: 0 });
  });

  test('bodyweight reps beat added weight', () => {
    const [record] = personalRecords([pullUp('2025-06-01', [{ weight: 45, reps: 5 }]), pullUp('2025-06-08', [{ weight: 0, reps: 12 }])]);
    expect(record).toMatchObject({ reps: 12, weight: 0 });
  });

  test('gives each exercise its own record, newest first', () => {
    const records = personalRecords([
      press('2025-06-01', [{ weight: 195, reps: 5 }]),
      pullUp('2025-06-10', [{ weight: 0, reps: 8 }]),
      { id: 'l', date: '2025-06-05', name: 'Leg Press Machine', exerciseId: 'Leg_Press', sets: [{ weight: 300, reps: 8 }] },
    ]);
    expect(records.map((r) => r.name)).toEqual(['Pull-Up', 'Leg Press Machine', 'Flat Chest Press Machine']);
  });

  test('keeps custom exercises under the name they were logged with', () => {
    const [record] = personalRecords([
      { id: 's', date: '2025-06-01', name: '  Sled Push ', exerciseId: null, sets: [{ weight: 90, reps: 4 }] },
    ]);
    expect(record).toMatchObject({ name: 'Sled Push', exerciseId: null, bodyweight: false });
  });

  test('is empty with nothing logged', () => {
    expect(personalRecords([])).toEqual([]);
  });
});
