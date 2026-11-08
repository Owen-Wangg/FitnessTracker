import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { FaTimes, FaSearch } from 'react-icons/fa';
import { GROUPS, searchExercises } from '../utils/exerciseLibrary';
import type { Exercise } from '../types';
import ExerciseThumb from './ExerciseThumb';
import { useDialog } from '../hooks/useDialog';
import '../assets/styles/ExerciseLibrary.css';

// What the picker hands back: a library exercise. The id is null only for an older entry that was logged by
// name before the list was fixed, which the form can still open and edit.
export interface PickedExercise {
  id: string | null;
  name: string;
}

interface ExercisePickerProps {
  show: boolean;
  onClose: () => void;
  onSelect: (picked: PickedExercise) => void;
}

// The sheet only exists while it is open, so the search box starts empty each time and the dialog
// behaviour (focus, Escape, Tab) is set up fresh.
const ExercisePicker = ({ show, onClose, onSelect }: ExercisePickerProps) =>
  show ? <PickerSheet onClose={onClose} onSelect={onSelect} /> : null;

const PickerSheet = ({ onClose, onSelect }: Omit<ExercisePickerProps, 'show'>) => {
  const [query, setQuery] = useState('');
  const dialog = useDialog(onClose);

  const trimmedQuery = query.trim();
  const results = searchExercises(trimmedQuery);

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
        ref={dialog.ref}
        className="library-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Choose an exercise"
        tabIndex={-1}
        onKeyDown={dialog.onKeyDown}
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
              data-autofocus
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
            <p className="library-empty">No exercise matches your search.</p>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default ExercisePicker;
