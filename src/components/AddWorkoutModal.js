import React, { useState } from 'react';
import '../assets/styles/AddWorkoutModal.css'; // Make sure this path is correct

const AddWorkoutModal = ({ show, onClose, onAddWorkout }) => {
  // --- START: Date state and initialization ---
  const today = new Date();
  // Correctly get local today in YYYY-MM-DD format
  const todayLocalISO = new Date(today.getTime() - (today.getTimezoneOffset() * 60000 ))
                        .toISOString()
                        .split("T")[0];

  const [date, setDate] = useState(todayLocalISO); // Initialize date state
  // --- END: Date state and initialization ---

  const [name, setName] = useState('');
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  if (!show) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    // Updated validation to include date (if you make it required)
    // The date input itself has 'required' attribute, so browser handles empty check for it mostly.
    // But good to have a check here too if you want a custom alert.
    if (!name || !weight || !sets || !reps || !date) { // Added !date to the check
      alert("Please fill all fields, including the date!");
      return;
    }
    // Pass the date to onAddWorkout
    onAddWorkout({
      name,
      date, // Add date here
      weight,
      sets,
      reps
    });
    // Reset form
    setName('');
    setDate(todayLocalISO); // Reset date to today
    setWeight('');
    setSets('');
    setReps('');
    // onClose(); // You might want to call onClose here if App.js doesn't always close it
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Add New Workout</h2>
        <form onSubmit={handleSubmit}>
          {/* --- START: Date Input Field --- */}
          <div className="form-group">
            <label htmlFor="workoutDate">Date</label>
            <input
              type="date"
              id="workoutDate"
              value={date}
              onChange={e => setDate(e.target.value)}
              required // Makes the browser require a value
            />
          </div>
          {/* --- END: Date Input Field --- */}

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
              min="0" // Optional: prevent negative weight
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
              min="0" // Optional: prevent negative sets
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
              min="0" // Optional: prevent negative reps
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