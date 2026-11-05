import React from 'react';
import { totalVolume, topSet } from '../utils/workoutMetrics';
import type { Workout } from '../types';
import '../assets/styles/SummaryCard.css';

// Hero card for today: big volume number plus quick stats.
const SummaryCard = ({ workouts = [] }: { workouts?: Workout[] }) => {
  const exerciseCount = workouts.length;
  const setCount = workouts.reduce(
    (sum, w) => sum + (w.sets || []).filter((s) => s.set_type !== 'warmup').length,
    0
  );
  const heaviest = workouts.reduce<{ weight: number; reps: number } | null>((best, w) => {
    const top = topSet(w);
    return top && (!best || top.weight > best.weight) ? top : best;
  }, null);

  return (
    <div className="summary-card-display card">
      <h3 className="summary-title eyebrow">Today's Summary</h3>
      <p className="summary-value">
        {totalVolume(workouts).toLocaleString()}
        <span className="summary-unit">lbs</span>
      </p>
      <p className="summary-subtitle">Total weight lifted</p>

      <div className="summary-stats">
        <div>
          <span className="summary-stat-value">{exerciseCount}</span>
          <span className="summary-stat-label">Exercises</span>
        </div>
        <div>
          <span className="summary-stat-value">{setCount}</span>
          <span className="summary-stat-label">Sets</span>
        </div>
        <div>
          <span className="summary-stat-value">{heaviest ? heaviest.weight.toLocaleString() : '--'}</span>
          <span className="summary-stat-label">Top weight</span>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;
