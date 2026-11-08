import { muscleSplit } from './muscleSplit';
import type { Workout } from '../types';

const today = '2025-06-30';
const log = (date: string, exerciseId: string, name: string, sets: number): Workout => ({
  id: `${date}-${exerciseId}`,
  date,
  name,
  exerciseId,
  sets: Array.from({ length: sets }, () => ({ weight: 100, reps: 8 })),
});
const chest = (date: string, sets: number) => log(date, 'Leverage_Chest_Press', 'Flat Chest Press Machine', sets);
const legs = (date: string, sets: number) => log(date, 'Leg_Press', 'Leg Press Machine', sets);
const share = (result: ReturnType<typeof muscleSplit>, group: string) => result.shares.find((s) => s.group === group);

describe('muscleSplit', () => {
  test('divides sets between groups as whole-number percentages', () => {
    const result = muscleSplit([chest('2025-06-20', 3), legs('2025-06-21', 1)], 'all', today);
    expect(result.total).toBe(4);
    expect(share(result, 'Chest')).toEqual({ group: 'Chest', sets: 3, percent: 75 });
    expect(share(result, 'Legs')).toEqual({ group: 'Legs', sets: 1, percent: 25 });
    expect(share(result, 'Back')).toEqual({ group: 'Back', sets: 0, percent: 0 });
  });

  test('always lists every group, in the usual order', () => {
    expect(muscleSplit([], 'all', today).shares.map((s) => s.group)).toEqual(['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core']);
  });

  test('only counts the chosen period, including its first day and today', () => {
    const workouts = [chest('2025-06-01', 2), chest('2025-05-31', 5), legs('2025-06-30', 1)]; // 30 days = Jun 1 to Jun 30
    const result = muscleSplit(workouts, '30d', today);
    expect(share(result, 'Chest')?.sets).toBe(2);
    expect(share(result, 'Legs')?.sets).toBe(1);
  });

  test('longer ranges reach further back, and all time reaches everything', () => {
    const workouts = [chest('2025-06-20', 1), chest('2025-04-20', 2), chest('2024-01-01', 4)];
    expect(muscleSplit(workouts, '30d', today).total).toBe(1);
    expect(muscleSplit(workouts, '90d', today).total).toBe(3);
    expect(muscleSplit(workouts, 'all', today).total).toBe(7);
  });

  test('leaves out warm-ups, custom exercises and future workouts', () => {
    const workouts: Workout[] = [
      { ...chest('2025-06-20', 0), sets: [{ weight: 45, reps: 10, set_type: 'warmup' }, { weight: 100, reps: 5 }] },
      { id: 's', date: '2025-06-20', name: 'Sled Push', exerciseId: null, sets: [{ weight: 90, reps: 4 }] },
      chest('2025-07-15', 3),
    ];
    const result = muscleSplit(workouts, 'all', today);
    expect(result.total).toBe(1);
  });

  test('has zero total and zero percentages with nothing logged', () => {
    const result = muscleSplit([], '90d', today);
    expect(result.total).toBe(0);
    expect(result.shares.every((s) => s.percent === 0)).toBe(true);
  });
});
