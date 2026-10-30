import React from 'react';

// Shown above the screens when workouts could not be loaded.
const LoadError = ({ onRetry }) => (
  <div className="load-error" role="alert">
    <span>Could not load your workouts. Check your connection and try again.</span>
    <button type="button" onClick={onRetry}>Retry</button>
  </div>
);

export default LoadError;
