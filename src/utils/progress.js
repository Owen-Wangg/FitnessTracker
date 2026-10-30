import { topSet, bestEstimated1RM, workoutVolume } from './workoutMetrics';
import { exerciseKey } from './exerciseLibrary';

// One point per calendar day for the chosen exercise, oldest first:
//   { date, top: { weight, reps }, e1rm, volume }
export const buildSeries = (workouts, key) => {
  const byDate = {};
  (workouts || [])
    .filter((w) => w && w.date && w.name && exerciseKey(w) === key)
    .forEach((w) => {
      const date = w.date.split('T')[0];
      const day = (byDate[date] = byDate[date] || { date, top: null, e1rm: 0, volume: 0 });
      const top = topSet(w);
      if (top && (!day.top || top.weight > day.top.weight || (top.weight === day.top.weight && top.reps > day.top.reps))) {
        day.top = top;
      }
      day.e1rm = Math.max(day.e1rm, bestEstimated1RM(w));
      day.volume += workoutVolume(w);
    });

  return Object.values(byDate)
    .filter((d) => d.top)
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const valueFor = (day, metric) => (metric === 'top' ? day.top.weight : day[metric]);

// A point is a PR when it beats everything before it. The first session is just the baseline.
export const personalRecordFlags = (values) => {
  let runningMax = -Infinity;
  return values.map((v, i) => {
    const isPR = i > 0 && v > runningMax;
    runningMax = Math.max(runningMax, v);
    return isPR;
  });
};
