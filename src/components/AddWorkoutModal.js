// src/components/AddWorkoutModal.js
import React, { useState } from 'react';
import '../assets/styles/AddWorkoutModal.css';

const AddWorkoutModal = ({ show, onClose, onAddWorkout }) => {
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  if (!show) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !weight || !sets || !reps) {
      alert("Please fill all fields!"); // Simple validation
      return;
    }
    onAddWorkout({ name, weight, sets, reps });
    // Reset form
    setName('');
    setWeight('');
    setSets('');
    setReps('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Add New Workout</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="workoutName">Workout Name</label>
            <input
              type="text"
              id="workoutName"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="weight">Weight (Lbs)</label>
            <input
              type="number"
              id="weight"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="sets">Sets</label>
            <input
              type="number"
              id="sets"
              value={sets}
              onChange={e => setSets(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="reps">Reps</label>
            <input
              type="number"
              id="reps"
              value={reps}
              onChange={e => setReps(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit">Add Workout</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWorkoutModal;