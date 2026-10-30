import React from 'react';
import { createPortal } from 'react-dom';
import { FaTimes } from 'react-icons/fa';
import { exerciseImageUrl, titleCase } from '../utils/exerciseLibrary';
import '../assets/styles/ExerciseLibrary.css';

// Photos (start and end position), muscles worked, and step-by-step instructions.
const ExerciseDetailModal = ({ exercise, onClose, onSelect }) => {
  if (!exercise) return null;

  const photos = Array.from({ length: exercise.images }, (_, i) => exerciseImageUrl(exercise, i));

  return createPortal(
    <div className="library-overlay detail-overlay" onClick={onClose}>
      <div
        className="library-sheet detail-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={exercise.name}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="library-header">
          <h2>{exercise.name}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="library-scroll">
          {photos.length > 0 && (
            <div className="detail-photos">
              {photos.map((src, i) => (
                <figure key={src}>
                  <img src={src} alt={`${exercise.name}, ${i === 0 ? 'start' : 'end'} position`} />
                  <figcaption>{i === 0 ? 'Start' : 'End'}</figcaption>
                </figure>
              ))}
            </div>
          )}

          <div className="tag-row">
            {exercise.primary.map((m) => (
              <span key={m} className="tag tag-primary">{titleCase(m)}</span>
            ))}
            {exercise.secondary.map((m) => (
              <span key={m} className="tag">{titleCase(m)}</span>
            ))}
            <span className="tag tag-outline">{titleCase(exercise.equipment)}</span>
            {exercise.level && <span className="tag tag-outline">{titleCase(exercise.level)}</span>}
          </div>

          {exercise.instructions.length > 0 && (
            <>
              <h3 className="detail-subtitle">How to</h3>
              <ol className="detail-steps">
                {exercise.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </>
          )}
        </div>

        {onSelect && (
          <div className="library-footer">
            <button type="button" onClick={() => onSelect(exercise)}>Select exercise</button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ExerciseDetailModal;
