import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaSearch, FaInfoCircle, FaPlus } from 'react-icons/fa';
import {
  MUSCLE_FILTERS,
  filterExercises,
  findExercise,
  titleCase,
  useExerciseLibrary,
} from '../utils/exerciseLibrary';
import ExerciseThumb from './ExerciseThumb';
import ExerciseDetailModal from './ExerciseDetailModal';
import '../assets/styles/ExerciseLibrary.css';

const PAGE_SIZE = 40;

// onSelect receives { id, name }; id is null for a custom exercise.
// recent: [{ exerciseId, name }] shown first when nothing is filtered.
const ExercisePicker = ({ show, onClose, onSelect, recent = [] }) => {
  const exercises = useExerciseLibrary();
  const [query, setQuery] = useState('');
  const [muscle, setMuscle] = useState('all');
  const [equipment, setEquipment] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [detail, setDetail] = useState(null);

  useEffect(() => setLimit(PAGE_SIZE), [query, muscle, equipment]);

  const equipmentOptions = useMemo(
    () => [...new Set(exercises.map((e) => e.equipment))].sort(),
    [exercises]
  );

  const results = useMemo(
    () => filterExercises(exercises, { query, muscle, equipment }),
    [exercises, query, muscle, equipment]
  );

  const recentExercises = useMemo(() => {
    const seen = new Set();
    return recent
      .map((r) => findExercise(r.exerciseId, r.name))
      .filter((e) => e && !seen.has(e.id) && seen.add(e.id))
      .slice(0, 6);
  }, [recent, exercises]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!show) return null;

  const choose = (exercise) => {
    onSelect({ id: exercise.id, name: exercise.name });
    setDetail(null);
  };

  const trimmedQuery = query.trim();
  const exactMatch = results.some((e) => e.name.toLowerCase() === trimmedQuery.toLowerCase());
  const showRecent = !trimmedQuery && muscle === 'all' && equipment === 'all' && recentExercises.length > 0;

  const renderRow = (exercise) => (
    <li key={exercise.id} className="exercise-row">
      <button type="button" className="exercise-row-main" onClick={() => choose(exercise)}>
        <ExerciseThumb exercise={exercise} />
        <span className="exercise-row-text">
          <span className="exercise-row-name">{exercise.name}</span>
          <span className="exercise-row-meta">
            {exercise.primary.map(titleCase).join(', ') || 'Full body'} &middot; {titleCase(exercise.equipment)}
          </span>
        </span>
      </button>
      <button
        type="button"
        className="icon-btn"
        onClick={() => setDetail(exercise)}
        aria-label={`Details for ${exercise.name}`}
      >
        <FaInfoCircle />
      </button>
    </li>
  );

  return createPortal(
    <div className="library-overlay" onClick={onClose}>
      <div
        className="library-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Choose an exercise"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="library-header">
          <h2>Choose exercise</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="library-controls">
          <div className="search-field">
            <FaSearch aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search 800+ exercises"
              aria-label="Search exercises"
              autoComplete="off"
            />
          </div>

          <div className="chip-row" role="group" aria-label="Filter by muscle">
            {MUSCLE_FILTERS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`chip ${muscle === m.id ? 'active' : ''}`}
                aria-pressed={muscle === m.id}
                onClick={() => setMuscle(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <select value={equipment} onChange={(e) => setEquipment(e.target.value)} aria-label="Filter by equipment">
            <option value="all">Any equipment</option>
            {equipmentOptions.map((eq) => (
              <option key={eq} value={eq}>{titleCase(eq)}</option>
            ))}
          </select>
        </div>

        <div className="library-scroll">
          {exercises.length === 0 && <p className="library-empty">Loading exercises...</p>}

          {showRecent && (
            <>
              <h3 className="library-section">Recent</h3>
              <ul className="exercise-list">{recentExercises.map(renderRow)}</ul>
              <h3 className="library-section">All exercises</h3>
            </>
          )}

          <ul className="exercise-list">{results.slice(0, limit).map(renderRow)}</ul>

          {exercises.length > 0 && results.length === 0 && (
            <p className="library-empty">No exercises match. Try a different search or filter.</p>
          )}

          {results.length > limit && (
            <button type="button" className="more-btn" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
              Show more ({results.length - limit} left)
            </button>
          )}
        </div>

        {trimmedQuery && !exactMatch && (
          <div className="library-footer">
            <button type="button" className="custom-btn" onClick={() => onSelect({ id: null, name: trimmedQuery })}>
              <FaPlus /> Use &ldquo;{trimmedQuery}&rdquo; as a custom exercise
            </button>
          </div>
        )}

        <ExerciseDetailModal exercise={detail} onClose={() => setDetail(null)} onSelect={choose} />
      </div>
    </div>,
    document.body
  );
};

export default ExercisePicker;
