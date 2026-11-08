import React, { useMemo } from 'react';
import { FaFire } from 'react-icons/fa';
import { formatLocalDate, totalVolume } from '../utils/workoutMetrics';
import { toDisplay } from '../utils/units';
import { useUnit } from './UnitProvider';
import type { Workout } from '../types';
import '../assets/styles/WeekStrip.css';

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// Monday of the week containing `date`, at local midnight.
const startOfWeek = (date: Date): Date => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

const addDays = (date: Date, n: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

// This week at a glance: which days you trained, and volume versus last week.
const WeekStrip = ({ workouts = [] }: { workouts?: Workout[] }) => {
  const { unit } = useUnit();
  const { days, trainedCount, volume, lastWeekVolume } = useMemo(() => {
    const monday = startOfWeek(new Date());
    const dayKeys = Array.from({ length: 7 }, (_, i) => formatLocalDate(addDays(monday, i)));
    const lastKeys = new Set(Array.from({ length: 7 }, (_, i) => formatLocalDate(addDays(monday, i - 7))));

    const thisWeek = workouts.filter((w) => dayKeys.includes(w.date));
    const trained = new Set(thisWeek.map((w) => w.date));
    const todayKey = formatLocalDate(new Date());

    return {
      days: dayKeys.map((key, i) => ({
        key,
        label: DAY_LABELS[i],
        trained: trained.has(key),
        today: key === todayKey,
      })),
      trainedCount: trained.size,
      volume: totalVolume(thisWeek),
      lastWeekVolume: totalVolume(workouts.filter((w) => lastKeys.has(w.date))),
    };
  }, [workouts]);

  const delta = lastWeekVolume > 0 ? ((volume - lastWeekVolume) / lastWeekVolume) * 100 : null;

  return (
    <div className="week-strip card">
      <div className="week-head">
        <h3 className="eyebrow">This week</h3>
        {trainedCount > 0 && (
          <span className="week-count">
            <FaFire aria-hidden="true" /> {trainedCount} {trainedCount === 1 ? 'day' : 'days'}
          </span>
        )}
      </div>

      <ol className="week-days" aria-label="Days trained this week">
        {days.map((d) => (
          <li
            key={d.key}
            className={`week-day ${d.trained ? 'trained' : ''} ${d.today ? 'today' : ''}`}
            aria-label={`${d.key}${d.trained ? ', trained' : ''}${d.today ? ', today' : ''}`}
          >
            {d.label}
          </li>
        ))}
      </ol>

      <div className="week-volume">
        <span className="week-volume-value">{toDisplay(volume, unit).toLocaleString()}</span>
        <span className="week-volume-unit">{unit} this week</span>
      </div>
      {delta !== null && (
        <p className={`week-delta ${delta >= 0 ? 'up' : 'down'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% vs last week
        </p>
      )}
    </div>
  );
};

export default WeekStrip;
