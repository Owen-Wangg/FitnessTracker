// src/components/WorkoutItem.js
import React from 'react';
import { FaTrash } from 'react-icons/fa';
import '../assets/styles/WorkoutItem.css';

const WorkoutItem = ({ workout, onDelete }) => {
  return (
    <div className="workout-item card">
      <div className="workout-details">
        <h3>{workout.name}</h3>
        <p>Weight: {workout.weight} kg</p> {/* Assume kg for now */}
        <p>Sets: {workout.sets}</p>
        <p>Reps: {workout.reps}</p>
      </div>
      {onDelete && (
        <button className="delete-button" onClick={() => onDelete(workout.id)}>
          <FaTrash />
        </button>
      )}
    </div>
  );
};

export default WorkoutItem;