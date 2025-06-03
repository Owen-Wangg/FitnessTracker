// src/components/SummaryCard.js
import React from 'react';
import '../assets/styles/SummaryCard.css';

const SummaryCard = ({ workouts }) => {
  const totalWeightLifted = workouts.reduce((total, workout) => {
    const weight = parseFloat(workout.weight) || 0;
    const sets = parseInt(workout.sets, 10) || 0;
    const reps = parseInt(workout.reps, 10) || 0;
    return total + (weight * sets * reps);
  }, 0);

  return (
    <div className="summary-card-display card"> {/* Changed class name to avoid conflict */}
      <h3 className="summary-title">Today's Summary</h3>
      <p className="summary-value">{totalWeightLifted.toLocaleString()} Lbs</p>
      <p className="summary-subtitle">Total weight lifted</p>
    </div>
  );
};

export default SummaryCard;