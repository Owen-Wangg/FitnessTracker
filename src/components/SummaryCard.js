import React from 'react';
import { totalVolume } from '../utils/workoutMetrics';
import '../assets/styles/SummaryCard.css';

const SummaryCard = ({ workouts = [] }) => {
  return (
    <div className="summary-card-display card">
      <h3 className="summary-title">Today's Summary</h3>
      <p className="summary-value">{totalVolume(workouts).toLocaleString()} Lbs</p>
      <p className="summary-subtitle">Total weight lifted</p>
    </div>
  );
};

export default SummaryCard;
