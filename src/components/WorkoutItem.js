import React, { useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { workoutVolume } from '../utils/workoutMetrics';
import { findExercise, titleCase, useExerciseLibrary } from '../utils/exerciseLibrary';
import ExerciseThumb from './ExerciseThumb';
import ExerciseDetailModal from './ExerciseDetailModal';
import '../assets/styles/WorkoutItem.css';

const WorkoutItem = ({ workout, onDelete }) => {
  const sets = workout.sets || [];
  const library = useExerciseLibrary(); // re-renders once the library has loaded
  const [showDetail, setShowDetail] = useState(false);
  const exercise = library.length ? findExercise(workout.exerciseId, workout.name) : null;

  return (
    <div className="workout-item card">
      {exercise ? (
        <button
          type="button"
          className="workout-thumb-btn"
          onClick={() => setShowDetail(true)}
          aria-label={`Show how to do ${workout.name}`}
        >
          <ExerciseThumb exercise={exercise} size={72} />
        </button>
      ) : (
        <ExerciseThumb exercise={null} size={72} />
      )}

      <div className="workout-details">
        <h3>{workout.name}</h3>
        {exercise && exercise.primary.length > 0 && (
          <p className="workout-muscles">{exercise.primary.map(titleCase).join(', ')}</p>
        )}
        <ol className="set-list">
          {sets.map((s) => (
            <li key={s.id || s.set_number}>
              <span className="set-list-weight">{s.weight} lbs</span>
              <span className="set-list-reps">&times; {s.reps}</span>
            </li>
          ))}
        </ol>
        <p className="workout-volume">{workoutVolume(workout).toLocaleString()} lbs total</p>
      </div>

      {onDelete && (
        <button
          className="delete-button"
          onClick={() => onDelete(workout.id)}
          aria-label={`Delete ${workout.name}`}
        >
          <FaTrash />
        </button>
      )}

      {showDetail && <ExerciseDetailModal exercise={exercise} onClose={() => setShowDetail(false)} />}
    </div>
  );
};

export default WorkoutItem;
