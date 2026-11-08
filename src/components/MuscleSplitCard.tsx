import React, { useMemo, useState } from 'react';
import { FaBalanceScale } from 'react-icons/fa';
import { DEFAULT_SPLIT_RANGE, SPLIT_RANGES, muscleSplit, type SplitRange } from '../utils/muscleSplit';
import { useToday } from '../hooks/useToday';
import type { Workout } from '../types';
import '../assets/styles/MuscleSplitCard.css';
import '../assets/styles/ThemeSelector.css';

// Where your training goes: each muscle group's share of your sets, over a period you choose.
const MuscleSplitCard = ({ workouts = [] }: { workouts?: Workout[] }) => {
  const [range, setRange] = useState<SplitRange>(DEFAULT_SPLIT_RANGE);
  const today = useToday();
  const { total, shares } = useMemo(() => muscleSplit(workouts, range, today), [workouts, range, today]);

  const biggest = Math.max(...shares.map((s) => s.sets), 1);
  const untouched = shares.filter((s) => s.sets === 0).map((s) => s.group);
  const least = [...shares].sort((a, b) => a.sets - b.sets)[0];

  const note =
    total === 0
      ? null
      : untouched.length > 0
        ? `No sets yet for ${untouched.join(', ')}`
        : `Least trained: ${least.group} (${least.percent}%)`;

  return (
    <div className="split-card card">
      <h3 className="split-title">
        <FaBalanceScale aria-hidden="true" /> Muscle balance
      </h3>

      <div className="theme-selector split-selector" role="radiogroup" aria-label="Period">
        {SPLIT_RANGES.map((option) => (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={range === option.key}
            className={`theme-option ${range === option.key ? 'active' : ''}`}
            onClick={() => setRange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <p className="split-empty">No sets logged in this period.</p>
      ) : (
        <>
          <ul className="split-list" aria-label="Share of sets by muscle group">
            {shares.map(({ group, sets, percent }) => (
              <li key={group} className={`split-row ${sets === 0 ? 'empty' : ''}`}>
                <span className="split-group">{group}</span>
                <span className="split-bar" aria-hidden="true">
                  <span className="split-fill" style={{ width: `${(sets / biggest) * 100}%` }} />
                </span>
                <span className="split-value">
                  {percent}% <span className="split-sets">· {sets} {sets === 1 ? 'set' : 'sets'}</span>
                </span>
              </li>
            ))}
          </ul>
          {note && <p className="split-note">{note}</p>}
        </>
      )}
    </div>
  );
};

export default MuscleSplitCard;
