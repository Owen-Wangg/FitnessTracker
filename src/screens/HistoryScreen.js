// src/screens/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import WorkoutList from '../components/WorkoutList';
import ProgressGraph from '../components/ProgressGraph';
import '../assets/styles/HistoryScreen.css';

const HistoryScreen = ({ allWorkouts, getWorkoutsForDate, deleteWorkout }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutsForSelectedDate, setWorkoutsForSelectedDate] = useState([]);
  const [selectedExerciseForGraph, setSelectedExerciseForGraph] = useState('');
  const [uniqueExercises, setUniqueExercises] = useState([]);

  // Ensure allWorkouts is an array before trying to map or set exercises
  useEffect(() => {
    if (allWorkouts && Array.isArray(allWorkouts)) {
      const exercises = [...new Set(allWorkouts.map(w => w.name).filter(name => name))]; // Filter out undefined/null names
      setUniqueExercises(exercises);
      if (exercises.length > 0 && (!selectedExerciseForGraph || !exercises.includes(selectedExerciseForGraph))) {
        setSelectedExerciseForGraph(exercises[0]);
      } else if (exercises.length === 0) {
        setSelectedExerciseForGraph(''); // Clear if no exercises
      }
    } else {
      setUniqueExercises([]); // Ensure it's an empty array if allWorkouts is not ready
      setSelectedExerciseForGraph('');
    }
  }, [allWorkouts, selectedExerciseForGraph]); // Removed selectedExerciseForGraph from dependency to avoid loop if it's being set here


  useEffect(() => {
    // Ensure getWorkoutsForDate is a function and selectedDate is valid
    if (typeof getWorkoutsForDate === 'function' && selectedDate) {
      const workouts = getWorkoutsForDate(selectedDate);
      setWorkoutsForSelectedDate(Array.isArray(workouts) ? workouts : []); // Ensure it's an array
    }
  }, [selectedDate, allWorkouts, getWorkoutsForDate]);


  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="history-screen">
      <h1>Workout History</h1>

      <div className="calendar-container card">
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          tileClassName={({ date, view }) => {
            if (view === 'month' && typeof getWorkoutsForDate === 'function') { // Check if getWorkoutsForDate is a function
              const workoutsOnDate = getWorkoutsForDate(date);
              // Check if workoutsOnDate is truthy (not null/undefined) AND is an array before accessing .length
              if (workoutsOnDate && Array.isArray(workoutsOnDate) && workoutsOnDate.length > 0) {
                return 'has-workouts';
              }
            }
            return null;
          }}
        />
      </div>

      <h2>Workouts on {selectedDate.toLocaleDateString()}</h2>
      <WorkoutList workouts={workoutsForSelectedDate} onDelete={deleteWorkout} />

      <div className="progress-graph-container card">
        <h2>Weight Progress</h2>
        {uniqueExercises.length > 0 ? (
          <>
            <select
              value={selectedExerciseForGraph}
              onChange={(e) => setSelectedExerciseForGraph(e.target.value)}
              className="exercise-select"
            >
              {uniqueExercises.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
            <ProgressGraph
              workouts={allWorkouts || []} // Pass an empty array if allWorkouts is undefined
              exerciseName={selectedExerciseForGraph}
            />
          </>
        ) : (
          <p>No workout data available for graph.</p>
        )}
      </div>
    </div>
  );
};

// Add defaultProps to HistoryScreen as well for robustness
HistoryScreen.defaultProps = {
  allWorkouts: [],
  getWorkoutsForDate: () => [], // Default to a function that returns an empty array
  deleteWorkout: () => {},
};

export default HistoryScreen;