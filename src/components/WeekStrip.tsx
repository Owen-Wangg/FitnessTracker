import React, { useMemo } from 'react';
import { FaFire, FaTrophy } from 'react-icons/fa';
import { formatLocalDate, totalVolume } from '../utils/workoutMetrics';
import { toDisplay } from '../utils/units';
import { countPersonalRecords, daysSinceByGroup, setsByGroup } from '../utils/weekSummary';
import { GROUPS } from '../types';
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

// How long ago a muscle group was trained, in words: "Trained today", "Trained 9d ago", "Not trained yet".
const trainedText = (age: number | null): string =>
  age === null ? 'Not trained yet' : age <= 0 ? 'Trained today' : age === 1 ? 'Trained yesterday' : `Trained ${age}d ago`;

const addDays = (date: Date, n: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);

// This week at a glance: which days you trained, volume versus last week, sets per muscle group
// and personal records.
const WeekStrip = ({ workouts = [] }: { workouts?: Workout[] }) => {
  const { unit } = useUnit();
  const { days, trainedCount, volume, lastWeekVolume, groupSets, groupAge, records } = useMemo(() => {
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
      groupSets: setsByGroup(thisWeek),
      groupAge: daysSinceByGroup(workouts, todayKey),
      records: countPersonalRecords(workouts, trained),
    };
  }, [workouts]);

  const delta = lastWeekVolume > 0 ? ((volume - lastWeekVolume) / lastWeekVolume) * 100 : null;

  return (
    <div className="week-strip card">
      <div className="week-head">
        <h3 className="eyebrow">This week</h3>
        <div className="week-badges">
          {records > 0 && (
            <span className="week-count week-records">
              <FaTrophy aria-hidden="true" /> {records} {records === 1 ? 'PR' : 'PRs'}
            </span>
          )}
          {trainedCount > 0 && (
            <span className="week-count">
              <FaFire aria-hidden="true" /> {trainedCount} {trainedCount === 1 ? 'day' : 'days'} trained
            </span>
          )}
        </div>
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
        <span className="week-volume-unit">{unit} lifted this week</span>
      </div>
      {delta !== null && (
        <p className={`week-delta ${delta >= 0 ? 'up' : 'down'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% {delta >= 0 ? 'more' : 'less'} than last week
        </p>
      )}

      {workouts.length > 0 && (
        <>
          <h4 className="week-groups-title">Muscle groups</h4>
          <ul className="week-groups" aria-label="Sets by muscle group">
            {GROUPS.map((group) => {
              const sets = groupSets[group];
              const age = groupAge[group];
              return (
                <li
                  key={group}
                  className={`week-group ${sets === 0 ? 'empty' : ''} ${age === null || age >= 7 ? 'stale' : ''}`}
                >
                  <span className="week-group-label">{group}</span>
                  <span className="week-group-sets">
                    <span className="week-group-count">{sets}</span>{' '}
                    <span className="week-group-unit">{sets === 1 ? 'set' : 'sets'}</span>
                  </span>
                  <span className="week-group-age">{trainedText(age)}</span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
};

export default WeekStrip;
