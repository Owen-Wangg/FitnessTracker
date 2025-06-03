// src/components/SummaryCard.js
import React from 'react';
import '../assets/styles/SummaryCard.css';

const SummaryCard = ({ workouts }) => {
  // Guard Clause: Check if workouts is defined and is an array
  if (!workouts || !Array.isArray(workouts) || workouts.length === 0) {
    // If no workouts, or workouts is not an array, display a default/empty state
    return (
      <div className="summary-card-display card">
        <h3 className="summary-title">Today's Summary</h3>
        <p className="summary-value">0 Lbs</p>
        <p className="summary-subtitle">Total weight lifted</p>
        {/* Or you could show a message like "No workouts today." */}
      </div>
    );
  }

  // If we reach here, 'workouts' is a non-empty array
  const totalWeightLifted = workouts.reduce((total, workout) => {
    // Ensure workout object itself is not null/undefined if that's possible
    if (!workout) return total;

    const weight = parseFloat(workout.weight) || 0;
    const sets = parseInt(workout.sets, 10) || 0;
    const reps = parseInt(workout.reps, 10) || 0;
    return total + (weight * sets * reps);
  }, 0); // Initial value 0 is good

  return (
    <div className="summary-card-display card">
      <h3 className="summary-title">Today's Summary</h3>
      <p className="summary-value">{totalWeightLifted.toLocaleString()} Lbs</p>
      <p className="summary-subtitle">Total weight lifted</p>
    </div>
  );
};

// Optional but recommended: Define default props
SummaryCard.defaultProps = {
  workouts: [] // Ensures 'workouts' is at least an empty array if not explicitly passed
};

export default SummaryCard;