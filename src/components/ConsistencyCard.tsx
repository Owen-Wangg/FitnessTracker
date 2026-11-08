import React, { useMemo, useState } from 'react';
import { FaFire } from 'react-icons/fa';
import { WEEKLY_GOALS, consistency, readGoal, saveGoal } from '../utils/consistency';
import { useToday } from '../hooks/useToday';
import { plural } from '../utils/format';
import type { Workout } from '../types';
import '../assets/styles/ConsistencyCard.css';
import '../assets/styles/ThemeSelector.css';

// Weekly streak and average. A streak is weeks in a row with at least your goal of training days.
const ConsistencyCard = ({ workouts = [] }: { workouts?: Workout[] }) => {
  const [goal, setGoal] = useState(() => readGoal(window.localStorage));
  const today = useToday();
  const stats = useMemo(() => consistency(workouts, goal, today), [workouts, goal, today]);

  const chooseGoal = (next: number) => {
    saveGoal(window.localStorage, next);
    setGoal(next);
  };

  const streakNote = stats.goalMetThisWeek
    ? 'Goal met this week'
    : `This week: ${stats.thisWeekDays} of ${goal} days`;

  return (
    <div className="consistency-card card">
      <h3 className="consistency-title">
        <FaFire aria-hidden="true" /> Consistency
      </h3>

      <div className="consistency-tiles">
        <div className="consistency-tile">
          <span className="consistency-value">{stats.currentStreak}</span>
          <span className="consistency-label">{stats.currentStreak === 1 ? 'week' : 'weeks'} in a row</span>
          <span className="consistency-note">{streakNote}</span>
          {stats.longestStreak > 0 && <span className="consistency-note">Best: {plural(stats.longestStreak, 'week')}</span>}
        </div>

        <div className="consistency-tile">
          <span className="consistency-value">
            {stats.averagePerWeek === null ? '–' : stats.averagePerWeek.toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </span>
          <span className="consistency-label">days per week</span>
          <span className="consistency-note">
            {stats.averagePerWeek === null ? 'Needs one finished week' : `Last ${plural(stats.weeksCounted, 'week')}`}
          </span>
        </div>
      </div>

      <div className="consistency-goal">
        <span id="goal-label" className="consistency-goal-label">Weekly goal (days)</span>
        <div className="theme-selector goal-selector" role="radiogroup" aria-labelledby="goal-label">
          {WEEKLY_GOALS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={goal === option}
              className={`theme-option ${goal === option ? 'active' : ''}`}
              onClick={() => chooseGoal(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConsistencyCard;
