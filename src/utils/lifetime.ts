// Totals across everything ever logged, for the Profile stats.
import type { Workout } from '../types';
import { totalVolume } from './workoutMetrics';

export interface LifetimeStats {
  daysTrained: number; // distinct days with a workout
  sets: number; // working sets (warm-ups left out)
  volume: number; // pounds actually lifted; body weight is not counted
  firstDate: string | null; // the earliest workout, 'YYYY-MM-DD'
}

export const lifetimeStats = (workouts: Workout[]): LifetimeStats => {
  const dates = workouts.map((w) => w.date).sort();
  return {
    daysTrained: new Set(dates).size,
    sets: workouts.reduce(
      (sum, w) => sum + w.sets.filter((s) => s.set_type !== 'warmup' && Number(s.reps) > 0).length,
      0
    ),
    volume: totalVolume(workouts),
    firstDate: dates[0] ?? null,
  };
};
