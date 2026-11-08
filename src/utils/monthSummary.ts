// Numbers for the monthly summary card.
import type { Workout } from '../types';
import { totalVolume } from './workoutMetrics';
import { countPersonalRecords } from './weekSummary';

export interface MonthStats {
  daysTrained: number;
  sets: number; // working sets (warm-ups left out)
  volume: number; // pounds
  lastMonthVolume: number; // pounds, over the same days of the previous month
  records: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

// Stats for the calendar month containing `today` ('YYYY-MM-DD'), up to and including today.
// The comparison covers the same stretch of the previous month (the 1st through the same day
// number), so early in a month it is not measured against a whole finished month.
export const monthStats = (workouts: Workout[], today: string): MonthStats => {
  const [year, month, day] = today.split('-').map(Number);
  const thisMonth = `${year}-${pad(month)}`;

  const previous = new Date(year, month - 2, 1);
  const previousMonth = `${previous.getFullYear()}-${pad(previous.getMonth() + 1)}`;
  const previousLastDay = Math.min(day, new Date(year, month - 1, 0).getDate());
  const previousEnd = `${previousMonth}-${pad(previousLastDay)}`;

  const current = workouts.filter((w) => w.date.startsWith(thisMonth) && w.date <= today);
  const earlier = workouts.filter((w) => w.date.startsWith(previousMonth) && w.date <= previousEnd);
  const dates = new Set(current.map((w) => w.date));

  return {
    daysTrained: dates.size,
    sets: current.reduce(
      (sum, w) => sum + w.sets.filter((s) => s.set_type !== 'warmup' && Number(s.reps) > 0).length,
      0
    ),
    volume: totalVolume(current),
    lastMonthVolume: totalVolume(earlier),
    records: countPersonalRecords(workouts, dates),
  };
};
