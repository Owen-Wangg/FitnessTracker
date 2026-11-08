import React, { useMemo, useState } from 'react';
import { FaPlus, FaTimes, FaChevronRight } from 'react-icons/fa';
import { daysBetween, formatLocalDate, parseLocalDate } from '../utils/workoutMetrics';
import { findExercise } from '../utils/exerciseLibrary';
import { daysAgoText, describeSets, lastSession } from '../utils/lastSession';
import { validateWorkoutForm } from '../utils/workoutForm';
import { fromDisplay, toDisplay, toInputValue, type Unit } from '../utils/units';
import ExercisePicker, { type PickedExercise } from './ExercisePicker';
import ExerciseThumb from './ExerciseThumb';
import { useUnit } from './UnitProvider';
import type { SetInput, Workout, WorkoutDraft, WorkoutSet } from '../types';
import '../assets/styles/WorkoutFormModal.css';

const emptySet = (): SetInput => ({ weight: '', reps: '' });

const shortDate = (date: string) => parseLocalDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

// Form rows hold the raw input strings. set_type is carried along (not shown) so editing keeps tags.
// Weights are shown in the chosen unit.
const rowsFrom = (workout: { sets: WorkoutSet[] } | null | undefined, unit: Unit): SetInput[] =>
  workout && workout.sets.length > 0
    ? workout.sets.map((s): SetInput => {
        const weight = toInputValue(Number(s.weight), unit);
        return {
          weight,
          reps: String(s.reps),
          ...(s.set_type && s.set_type !== 'normal' ? { set_type: s.set_type } : {}),
          ...(unit === 'kg' ? { source: { shown: weight, lbs: Number(s.weight) } } : {}),
        };
      })
    : [emptySet()];

// Add or edit one exercise. Mount it to open it and unmount it to close it.
//   initial:  the workout being edited, or null/undefined to add a new one
//   onSubmit: resolves true when saved, which closes the form (the caller does that)
//   history:  all logged workouts, used to show what you did last time for the chosen exercise
interface WorkoutFormModalProps {
  initial?: Workout | null;
  history?: Workout[];
  onClose: () => void;
  onSubmit: (draft: WorkoutDraft) => Promise<boolean>;
}

const WorkoutFormModal = ({ initial = null, history = [], onClose, onSubmit }: WorkoutFormModalProps) => {
  const editing = Boolean(initial);
  const [date, setDate] = useState(() => initial?.date ?? formatLocalDate(new Date()));
  const [exercise, setExercise] = useState<PickedExercise | null>(() =>
    initial ? { id: initial.exerciseId ?? null, name: initial.name } : null
  ); // id is null for custom exercises
  const [showPicker, setShowPicker] = useState(false);
  const { unit } = useUnit();
  const [sets, setSets] = useState<SetInput[]>(() => rowsFrom(initial, unit));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const libraryEntry = exercise ? findExercise(exercise.id, exercise.name) : null;
  const bodyweight = libraryEntry?.loadType === 'bodyweight';
  const lastTime = useMemo(() => (exercise ? lastSession(history, exercise, date) : null), [history, exercise, date]);

  // Fills the form with last time's sets. Only on request: nothing is pre-filled automatically.
  const useLastTime = () => {
    if (!lastTime) return;
    setSets(rowsFrom(lastTime, unit));
    setError('');
  };
  // Hide the button once the form already holds exactly those sets.
  const matchesLastTime =
    lastTime !== null &&
    sets.length === lastTime.sets.length &&
    sets.every((s, i) => s.weight === toInputValue(Number(lastTime.sets[i].weight), unit) && s.reps === String(lastTime.sets[i].reps));

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) =>
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  // New sets start as a copy of the previous one's numbers, since most sets repeat.
  const addSet = () =>
    setSets((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, { weight: last.weight, reps: last.reps, ...(last.source ? { source: last.source } : {}) }];
    });

  const removeSet = (index: number) => setSets((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const result = validateWorkoutForm({ exercise, date, sets });
    if (result.error !== undefined) {
      setError(result.error);
      return;
    }
    if (!exercise) return; // unreachable: validateWorkoutForm rejects a missing exercise
    setError('');

    // Typed weights are in the chosen unit; store pounds. A weight left as first shown keeps its exact pounds.
    const poundSets = result.sets.map((s, i) => {
      const source = sets[i].source;
      const untouched = source && sets[i].weight === source.shown;
      return { ...s, weight: untouched ? source.lbs : fromDisplay(s.weight, unit) };
    });

    setSaving(true);
    await onSubmit({
      name: exercise.name,
      exerciseId: exercise.id,
      date,
      sets: poundSets,
    });
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        role="dialog"
        aria-modal="true"
        aria-label={editing ? 'Edit exercise' : 'Add exercise'}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{editing ? 'Edit Exercise' : 'Add Exercise'}</h2>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="workoutDate">Date</label>
            <input
              type="date"
              id="workoutDate"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <span className="field-label">Exercise</span>
            <button type="button" className="exercise-select-btn" onClick={() => setShowPicker(true)}>
              {exercise ? (
                <>
                  <ExerciseThumb exercise={libraryEntry} size={48} />
                  <span className="exercise-select-text">
                    <span className="exercise-select-name">{exercise.name}</span>
                    {!libraryEntry && <span className="exercise-select-meta">Custom exercise</span>}
                    {bodyweight && <span className="exercise-select-meta">Bodyweight: added weight is optional</span>}
                  </span>
                  <span className="exercise-select-action">Change</span>
                </>
              ) : (
                <>
                  <span className="exercise-select-text">
                    <span className="exercise-select-name">Choose an exercise</span>
                  </span>
                  <FaChevronRight aria-hidden="true" />
                </>
              )}
            </button>
          </div>

          {lastTime && (
            <div className="last-time">
              <div className="last-time-head">
                <span className="last-time-label">Last time</span>
                <span className="last-time-when">
                  {daysAgoText(daysBetween(lastTime.date, formatLocalDate(new Date())))} · {shortDate(lastTime.date)}
                </span>
              </div>
              <ul className="last-time-sets">
                {describeSets(lastTime.sets, bodyweight, (lbs) => `${toDisplay(lbs, unit)} ${unit}`).map((text, i) => (
                  <li key={i}>{text}</li>
                ))}
              </ul>
              {!matchesLastTime && (
                <button type="button" className="last-time-use" onClick={useLastTime}>
                  Use these sets
                </button>
              )}
            </div>
          )}

          <div className="sets-editor">
            <div className="sets-row sets-row-header" aria-hidden="true">
              <span>Set</span>
              <span>{bodyweight ? `Added (${unit})` : `Weight (${unit})`}</span>
              <span>Reps</span>
              <span />
            </div>
            {sets.map((s, i) => (
              <div className="sets-row" key={i}>
                <span className="set-number">{i + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label={`Set ${i + 1} ${bodyweight ? 'added weight' : 'weight'} in ${unit === 'kg' ? 'kilograms' : 'pounds'}`}
                  value={s.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value)}
                  placeholder={bodyweight ? 'BW' : undefined}
                  min="0"
                  step={unit === 'kg' ? '0.25' : '0.5'}
                  required={!bodyweight}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label={`Set ${i + 1} reps`}
                  value={s.reps}
                  onChange={(e) => updateSet(i, 'reps', e.target.value)}
                  min="1"
                  step="1"
                  required
                />
                <button
                  type="button"
                  className="remove-set-btn"
                  onClick={() => removeSet(i)}
                  disabled={sets.length === 1}
                  aria-label={`Remove set ${i + 1}`}
                >
                  <FaTimes />
                </button>
              </div>
            ))}
            <button type="button" className="add-set-btn" onClick={addSet}>
              <FaPlus /> Add set
            </button>
          </div>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : editing ? 'Save changes' : 'Save'}
            </button>
          </div>
        </form>

        <ExercisePicker
          show={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={(picked) => {
            setExercise(picked);
            setError('');
            setShowPicker(false);
          }}
        />
      </div>
    </div>
  );
};

export default WorkoutFormModal;
