import React, { useMemo, useState } from 'react';
import { FaTrophy } from 'react-icons/fa';
import { findExercise } from '../utils/exerciseLibrary';
import { personalRecords, type PersonalRecord } from '../utils/records';
import { parseLocalDate } from '../utils/workoutMetrics';
import { toDisplay } from '../utils/units';
import { useUnit } from './UnitProvider';
import ExerciseThumb from './ExerciseThumb';
import type { Workout } from '../types';
import '../assets/styles/PersonalRecordsCard.css';

const SHOWN_AT_FIRST = 5;

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 1 });
const shortDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Your best set for every exercise you have logged, most recently set first.
const PersonalRecordsCard = ({ workouts = [] }: { workouts?: Workout[] }) => {
  const { unit } = useUnit();
  const [expanded, setExpanded] = useState(false);
  const records = useMemo(() => personalRecords(workouts), [workouts]);
  const visible = expanded ? records : records.slice(0, SHOWN_AT_FIRST);

  const headline = (r: PersonalRecord) =>
    r.bodyweight
      ? `${r.reps} reps${r.weight > 0 ? ` · +${fmt(toDisplay(r.weight, unit))} ${unit}` : ''}`
      : `${fmt(toDisplay(r.weight, unit))} ${unit} × ${r.reps}`;

  const detail = (r: PersonalRecord) =>
    r.bodyweight ? shortDate(r.date) : `Est. 1RM ${fmt(toDisplay(r.e1rm, unit))} ${unit} · ${shortDate(r.date)}`;

  return (
    <div className="records-card card">
      <h3 className="records-title">
        <FaTrophy aria-hidden="true" /> Personal records
      </h3>

      {records.length === 0 ? (
        <p className="records-empty">Log a few workouts and your best lift for each exercise will show up here.</p>
      ) : (
        <>
          <ul className="records-list">
            {visible.map((r) => (
              <li key={r.key} className="record-row">
                <ExerciseThumb exercise={findExercise(r.exerciseId, r.name)} size={44} />
                <div className="record-text">
                  <span className="record-name">{r.name}</span>
                  <span className="record-detail">{detail(r)}</span>
                </div>
                <span className="record-value">{headline(r)}</span>
              </li>
            ))}
          </ul>
          {records.length > SHOWN_AT_FIRST && (
            <button type="button" className="records-toggle" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
              {expanded ? 'Show fewer' : `Show all ${records.length}`}
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default PersonalRecordsCard;
