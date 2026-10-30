import React, { useState } from 'react';
import { FaPlus, FaTimes, FaChevronRight } from 'react-icons/fa';
import { formatLocalDate } from '../utils/workoutMetrics';
import { findExercise } from '../utils/exerciseLibrary';
import { validateWorkoutForm } from '../utils/workoutForm';
import ExercisePicker from './ExercisePicker';
import ExerciseThumb from './ExerciseThumb';
import '../assets/styles/WorkoutFormModal.css';

const emptySet = () => ({ weight: '', reps: '' });

// Form rows hold the raw input strings. set_type is carried along (not shown) so editing keeps tags.
const rowsFrom = (workout) =>
  workout && workout.sets.length > 0
    ? workout.sets.map((s) => ({
        weight: String(s.weight),
        reps: String(s.reps),
        ...(s.set_type && s.set_type !== 'normal' ? { set_type: s.set_type } : {}),
      }))
    : [emptySet()];

// Add or edit one exercise. Mount it to open it and unmount it to close it.
//   initial:  the workout being edited, or null/undefined to add a new one
//   onSubmit: ({ name, exerciseId, date, sets }) => Promise<boolean>; true closes the form (the caller does that)
const WorkoutFormModal = ({ initial = null, onClose, onSubmit }) => {
  const editing = Boolean(initial);
  const [date, setDate] = useState(() => initial?.date ?? formatLocalDate(new Date()));
  const [exercise, setExercise] = useState(() =>
    initial ? { id: initial.exerciseId ?? null, name: initial.name } : null
  ); // { id, name }; id is null for custom exercises
  const [showPicker, setShowPicker] = useState(false);
  const [sets, setSets] = useState(() => rowsFrom(initial));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const libraryEntry = exercise ? findExercise(exercise.id, exercise.name) : null;

  const updateSet = (index, field, value) =>
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  // New sets start as a copy of the previous one's numbers, since most sets repeat.
  const addSet = () =>
    setSets((prev) => {
      const last = prev[prev.length - 1];
      return [...prev, { weight: last.weight, reps: last.reps }];
    });

  const removeSet = (index) => setSets((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = validateWorkoutForm({ exercise, date, sets });
    if (result.error) {
      setError(result.error);
      return;
    }
    setError('');

    setSaving(true);
    await onSubmit({
      name: exercise.name,
      exerciseId: exercise.id,
      date,
      sets: result.sets,
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

          <div className="sets-editor">
            <div className="sets-row sets-row-header" aria-hidden="true">
              <span>Set</span>
              <span>Weight (lbs)</span>
              <span>Reps</span>
              <span />
            </div>
            {sets.map((s, i) => (
              <div className="sets-row" key={i}>
                <span className="set-number">{i + 1}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label={`Set ${i + 1} weight in pounds`}
                  value={s.weight}
                  onChange={(e) => updateSet(i, 'weight', e.target.value)}
                  min="0"
                  step="0.5"
                  required
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
