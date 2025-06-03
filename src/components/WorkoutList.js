// src/components/WorkoutList.js
import React from 'react';
import WorkoutItem from './WorkoutItem';
import { FaDumbbell } from 'react-icons/fa'; // Import dumbbell icon
import '../assets/styles/WorkoutList.css';

const WorkoutList = ({ workouts, onDelete }) => {
  if (!workouts || workouts.length === 0) {
    return (
      <div className="no-workouts-placeholder card"> {/* Add card class for styling */}
        <FaDumbbell className="placeholder-icon" size={48} />
        <p className="placeholder-text-main">No workouts yet today</p>
        <p className="placeholder-text-sub">
          Tap the + button to add your first workout
        </p>
      </div>
    );
  }

  return (
    <div className="workout-list">
      {workouts.map(workout => (
        <WorkoutItem key={workout.id} workout={workout} onDelete={onDelete} />
      ))}
    </div>
  );
};

export default WorkoutList;