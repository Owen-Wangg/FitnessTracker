import React from 'react';
import { FaPen, FaTrash } from 'react-icons/fa';
import { workoutReps, workoutVolume } from '../utils/workoutMetrics';
import { plural } from '../utils/format';
import { findExercise } from '../utils/exerciseLibrary';
import { toDisplay } from '../utils/units';
import type { Workout } from '../types';
import { useUnit } from './UnitProvider';
import ExerciseThumb from './ExerciseThumb';
import '../assets/styles/WorkoutItem.css';

interface WorkoutItemProps {
  workout: Workout;
  onDelete?: (id: string) => void;
  onEdit?: (workout: Workout) => void;
}

const WorkoutItem = ({ workout, onDelete, onEdit }: WorkoutItemProps) => {
  const { unit } = useUnit();
  const sets = workout.sets || [];
  const exercise = findExercise(workout.exerciseId, workout.name);
  const bodyweight = exercise?.loadType === 'bodyweight';

  // Weight lifted in total. Body weight is not counted, so a bodyweight exercise shows its reps instead
  // (plus the extra weight, if any was added).
  const lifted = toDisplay(workoutVolume(workout), unit);
  const totalText = bodyweight
    ? `${plural(workoutReps(workout), 'rep')} total${lifted > 0 ? ` · ${lifted.toLocaleString()} ${unit} added` : ''}`
    : `${lifted.toLocaleString()} ${unit} total`;

  return (
    <div className="workout-item card">
      <ExerciseThumb exercise={exercise} size={64} />

      <div className="workout-details">
        <h3>{workout.name}</h3>
        <ol className="set-list">
          {sets.map((s) => (
            <li key={s.id || s.set_number}>
              <span className="set-list-weight">
                {bodyweight
                  ? Number(s.weight) > 0 ? `BW + ${toDisplay(Number(s.weight), unit)} ${unit}` : 'Bodyweight'
                  : `${toDisplay(Number(s.weight), unit)} ${unit}`}
              </span>
              <span className="set-list-reps">&times; {s.reps}</span>
            </li>
          ))}
        </ol>
        <p className="workout-volume">{totalText}</p>
      </div>

      {(onEdit || onDelete) && (
        <div className="workout-actions">
          {onEdit && (
            <button
              className="edit-button"
              onClick={() => onEdit(workout)}
              aria-label={`Edit ${workout.name}`}
            >
              <FaPen />
            </button>
          )}
          {onDelete && (
            <button
              className="delete-button"
              onClick={() => onDelete(workout.id)}
              aria-label={`Delete ${workout.name}`}
            >
              <FaTrash />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutItem;
