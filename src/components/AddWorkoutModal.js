import React, { useState } from 'react';
import { FaPlus, FaTimes } from 'react-icons/fa';
import { formatLocalDate } from '../utils/workoutMetrics';
import '../assets/styles/AddWorkoutModal.css';

const emptySet = () => ({ weight: '', reps: '' });

const AddWorkoutModal = ({ show, onClose, onAddWorkout, exerciseNames = [] }) => {
  const [date, setDate] = useState(() => formatLocalDate(new Date()));
  const [name, setName] = useState('');
  const [sets, setSets] = useState([emptySet()]);
  const [saving, setSaving] = useState(false);

  if (!show) {
    return null;
  }

  const updateSet = (index, field, value) =>
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  // New sets start as a copy of the previous one, since most sets repeat.
  const addSet = () => setSets((prev) => [...prev, { ...prev[prev.length - 1] }]);

  const removeSet = (index) => setSets((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedSets = sets.map((s) => ({
      weight: s.weight === '' ? NaN : parseFloat(s.weight),
      reps: parseInt(s.reps, 10),
    }));

    if (!trimmedName || !date || parsedSets.some((s) => isNaN(s.weight) || !(s.reps > 0))) {
      alert('Please fill in the date, exercise name, and weight and reps for every set.');
      return;
    }

    setSaving(true);
    const ok = await onAddWorkout({ name: trimmedName, date, sets: parsedSets });
    setSaving(false);

    if (ok) {
      setName('');
      setDate(formatLocalDate(new Date()));
      setSets([emptySet()]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Add Exercise</h2>
        <form onSubmit={handleSubmit}>
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
            <label htmlFor="workoutName">Exercise</label>
            <input
              type="text"
              id="workoutName"
              list="exercise-suggestions"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bench Press"
              autoComplete="off"
              required
            />
            <datalist id="exercise-suggestions">
              {exerciseNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
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

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkoutModal;
