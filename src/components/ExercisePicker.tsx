import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaSearch, FaPlus } from 'react-icons/fa';
import { GROUPS, searchExercises } from '../utils/exerciseLibrary';
import type { Exercise } from '../types';
import ExerciseThumb from './ExerciseThumb';
import '../assets/styles/ExerciseLibrary.css';

// What the picker hands back: a library exercise, or a custom one (id null).
export interface PickedExercise {
  id: string | null;
  name: string;
}

interface ExercisePickerProps {
  show: boolean;
  onClose: () => void;
  onSelect: (picked: PickedExercise) => void;
}

const ExercisePicker = ({ show, onClose, onSelect }: ExercisePickerProps) => {
  const [query, setQuery] = useState('');

  if (!show) return null;

  const trimmedQuery = query.trim();
  const results = searchExercises(trimmedQuery);
  const exactMatch = results.some((e) => e.name.toLowerCase() === trimmedQuery.toLowerCase());

  const renderRow = (exercise: Exercise) => (
    <li key={exercise.id}>
      <button
        type="button"
        className="exercise-row"
        onClick={() => onSelect({ id: exercise.id, name: exercise.name })}
      >
        <ExerciseThumb exercise={exercise} size={48} />
        <span className="exercise-row-name">{exercise.name}</span>
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
              placeholder="Search"
              aria-label="Search exercises"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="library-scroll">
          {trimmedQuery ? (
            <ul className="exercise-list">{results.map(renderRow)}</ul>
          ) : (
            GROUPS.map((group) => (
              <section key={group}>
                <h3 className="library-section">{group}</h3>
                <ul className="exercise-list">
                  {results.filter((e) => e.group === group).map(renderRow)}
                </ul>
              </section>
            ))
          )}

          {trimmedQuery && results.length === 0 && (
            <p className="library-empty">No match in the basics.</p>
          )}
        </div>

        {trimmedQuery && !exactMatch && (
          <div className="library-footer">
            <button type="button" className="custom-btn" onClick={() => onSelect({ id: null, name: trimmedQuery })}>
              <FaPlus /> Use &ldquo;{trimmedQuery}&rdquo; as a custom exercise
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ExercisePicker;
