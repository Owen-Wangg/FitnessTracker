import React from 'react';
import WorkoutItem from './WorkoutItem';
import { FaDumbbell } from 'react-icons/fa';
import '../assets/styles/WorkoutList.css';

const WorkoutList = ({ workouts, onDelete, onEdit, loading = false }) => {
  if (loading) {
    return (
      <div className="no-workouts-placeholder card" aria-busy="true">
        <p className="placeholder-text-sub">Loading workouts...</p>
      </div>
    );
  }

  if (!workouts || workouts.length === 0) {
    return (
      <div className="no-workouts-placeholder card">
        <FaDumbbell className="placeholder-icon" size={48} />
        <p className="placeholder-text-main">No workouts yet</p>
        <p className="placeholder-text-sub">Tap Add to log an exercise</p>
      </div>
    );
  }

  return (
    <div className="workout-list">
      {workouts.map(workout => (
        <WorkoutItem key={workout.id} workout={workout} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
};

export default WorkoutList;
