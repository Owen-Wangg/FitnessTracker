// How consistently you train: a streak of weeks that met a goal, and your weekly average.
import type { Workout } from '../types';
import { formatLocalDate, parseLocalDate } from './workoutMetrics';

export const GOAL_KEY = 'fitness-weekly-goal';
export const WEEKLY_GOALS = [2, 3, 4, 5];
export const DEFAULT_GOAL = 3;
export const AVERAGE_WEEKS = 8;

type ReadableStorage = Pick<Storage, 'getItem'>;
type WritableStorage = Pick<Storage, 'setItem'>;

// The saved goal (training days per week), or the default if missing or not one of the choices.
export const readGoal = (storage: ReadableStorage): number => {
  try {
    const saved = Number(storage.getItem(GOAL_KEY));
    return WEEKLY_GOALS.includes(saved) ? saved : DEFAULT_GOAL;
  } catch {
    return DEFAULT_GOAL; // storage blocked (private mode, etc.)
  }
};

export const saveGoal = (storage: WritableStorage, goal: number): void => {
  try {
    storage.setItem(GOAL_KEY, String(goal));
  } catch {
    // ignore: the goal still applies for this visit
  }
};

export interface Consistency {
  currentStreak: number; // weeks in a row that met the goal, up to now
  longestStreak: number;
  thisWeekDays: number; // days trained so far this week
  goalMetThisWeek: boolean;
  averagePerWeek: number | null; // training days per week over recent finished weeks; null with none yet
  weeksCounted: number; // how many finished weeks the average covers
}

// Monday of the week containing a 'YYYY-MM-DD' date.
const mondayOf = (date: string): string => {
  const d = parseLocalDate(date);
  return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)));
};

const nextMonday = (monday: string): string => {
  const d = parseLocalDate(monday);
  return formatLocalDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
};

// Weeks run Monday to Sunday and count distinct days trained. The current week is still in progress, so
// it adds to a streak once it meets the goal but never breaks one before then. The average covers up to
// the last eight finished weeks, including weeks with no training. Workouts dated after `today` are ignored.
export const consistency = (workouts: Workout[], goal: number, today: string): Consistency => {
  const daysByWeek = new Map<string, Set<string>>();
  workouts.forEach((w) => {
    if (w.date > today) return;
    const week = mondayOf(w.date);
    if (!daysByWeek.has(week)) daysByWeek.set(week, new Set());
    daysByWeek.get(week)?.add(w.date);
  });

  const thisMonday = mondayOf(today);
  if (daysByWeek.size === 0) {
    return { currentStreak: 0, longestStreak: 0, thisWeekDays: 0, goalMetThisWeek: false, averagePerWeek: null, weeksCounted: 0 };
  }

  // Days trained in every week from the first workout's week to this one, empty weeks included.
  const weeks: number[] = [];
  for (let monday = [...daysByWeek.keys()].sort()[0]; monday <= thisMonday; monday = nextMonday(monday)) {
    weeks.push(daysByWeek.get(monday)?.size ?? 0);
  }

  const thisWeekDays = weeks[weeks.length - 1];
  const goalMetThisWeek = thisWeekDays >= goal;

  let longestStreak = 0;
  let run = 0;
  weeks.forEach((days, i) => {
    const inProgress = i === weeks.length - 1 && days < goal;
    if (days >= goal && !inProgress) run += 1;
    else run = 0;
    longestStreak = Math.max(longestStreak, run);
  });

  // Count back from the last week that is settled: this one if it met the goal, otherwise last week.
  let currentStreak = 0;
  for (let i = goalMetThisWeek ? weeks.length - 1 : weeks.length - 2; i >= 0 && weeks[i] >= goal; i -= 1) currentStreak += 1;

  const finished = weeks.slice(0, -1).slice(-AVERAGE_WEEKS);
  const averagePerWeek = finished.length > 0 ? finished.reduce((a, b) => a + b, 0) / finished.length : null;

  return { currentStreak, longestStreak, thisWeekDays, goalMetThisWeek, averagePerWeek, weeksCounted: finished.length };
};
