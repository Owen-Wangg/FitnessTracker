import React, { useMemo } from 'react';
import { FaTrophy } from 'react-icons/fa';
import { formatLocalDate, parseLocalDate } from '../utils/workoutMetrics';
import { monthStats } from '../utils/monthSummary';
import { toDisplay } from '../utils/units';
import { useUnit } from './UnitProvider';
import type { Workout } from '../types';
import '../assets/styles/MonthSummary.css';

// This month so far: days trained, sets, volume versus the same point last month, and PRs.
const MonthSummary = ({ workouts = [] }: { workouts?: Workout[] }) => {
  const { unit } = useUnit();
  const { today, stats } = useMemo(() => {
    const todayKey = formatLocalDate(new Date());
    return { today: todayKey, stats: monthStats(workouts, todayKey) };
  }, [workouts]);

  const monthName = parseLocalDate(today).toLocaleDateString('en-US', { month: 'long' });
  const delta = stats.lastMonthVolume > 0 ? ((stats.volume - stats.lastMonthVolume) / stats.lastMonthVolume) * 100 : null;

  return (
    <div className="month-summary card">
      <div className="month-head">
        <h3 className="eyebrow">{monthName} so far</h3>
        {stats.records > 0 && (
          <span className="month-records">
            <FaTrophy aria-hidden="true" /> {stats.records} {stats.records === 1 ? 'PR' : 'PRs'}
          </span>
        )}
      </div>

      <div className="month-volume">
        <span className="month-volume-value">{toDisplay(stats.volume, unit).toLocaleString()}</span>
        <span className="month-volume-unit">{unit} lifted</span>
      </div>
      {delta !== null && (
        <p className={`month-delta ${delta >= 0 ? 'up' : 'down'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(0)}% vs same point last month
        </p>
      )}

      <div className="month-stats">
        <div>
          <span className="month-stat-value">{stats.daysTrained}</span>
          <span className="month-stat-label">Days trained</span>
        </div>
        <div>
          <span className="month-stat-value">{stats.sets}</span>
          <span className="month-stat-label">Sets</span>
        </div>
      </div>
    </div>
  );
};

export default MonthSummary;
