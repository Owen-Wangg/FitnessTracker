// src/screens/HistoryScreen.js
import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css'; // Default styling, can be overridden
import WorkoutList from '../components/WorkoutList';
import ProgressGraph from '../components/ProgressGraph';
import '../assets/styles/HistoryScreen.css'; // For custom calendar and graph styling

const HistoryScreen = ({ allWorkouts, getWorkoutsForDate, deleteWorkout }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [workoutsForSelectedDate, setWorkoutsForSelectedDate] = useState([]);
  const [selectedExerciseForGraph, setSelectedExerciseForGraph] = useState('');
  const [uniqueExercises, setUniqueExercises] = useState([]);


  useEffect(() => {
    setWorkoutsForSelectedDate(getWorkoutsForDate(selectedDate));
  }, [selectedDate, allWorkouts, getWorkoutsForDate]);

  useEffect(() => {
    const exercises = [...new Set(allWorkouts.map(w => w.name))];
    setUniqueExercises(exercises);
    if (exercises.length > 0 && !selectedExerciseForGraph) {
      setSelectedExerciseForGraph(exercises[0]);
    }
  }, [allWorkouts, selectedExerciseForGraph]);


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
            if (view === 'month') {
              const workoutsOnDate = getWorkoutsForDate(date);
              if (workoutsOnDate.length > 0) {
                return 'has-workouts'; // Class for dates with workouts
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
              workouts={allWorkouts}
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

export default HistoryScreen;