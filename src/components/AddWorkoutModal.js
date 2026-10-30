import React, { useState } from 'react';
import { FaPlus, FaTimes, FaChevronRight } from 'react-icons/fa';
import { formatLocalDate } from '../utils/workoutMetrics';
import { findExercise } from '../utils/exerciseLibrary';
import { validateWorkoutForm } from '../utils/workoutForm';
import ExercisePicker from './ExercisePicker';
import ExerciseThumb from './ExerciseThumb';
import '../assets/styles/AddWorkoutModal.css';

const emptySet = () => ({ weight: '', reps: '' });

const AddWorkoutModal = ({ show, onClose, onAddWorkout }) => {
  const [date, setDate] = useState(() => formatLocalDate(new Date()));
  const [exercise, setExercise] = useState(null); // { id, name }; id is null for custom exercises
  const [showPicker, setShowPicker] = useState(false);
  const [sets, setSets] = useState([emptySet()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!show) {
    return null;
  }

  const libraryEntry = exercise ? findExercise(exercise.id, exercise.name) : null;

  const updateSet = (index, field, value) =>
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  // New sets start as a copy of the previous one, since most sets repeat.
  const addSet = () => setSets((prev) => [...prev, { ...prev[prev.length - 1] }]);

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
    const ok = await onAddWorkout({
      name: exercise.name,
      exerciseId: exercise.id,
      date,
      sets: result.sets,
    });
    setSaving(false);

    if (ok) {
      setExercise(null);
      setDate(formatLocalDate(new Date()));
      setSets([emptySet()]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add Exercise</h2>
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
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
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

export default AddWorkoutModal;
