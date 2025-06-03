import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import WorkoutList from '../components/WorkoutList';
import ProgressGraph from '../components/ProgressGraph';
import '../assets/styles/HistoryScreen.css';

const HistoryScreen = ({ allWorkouts, getWorkoutsForDate, deleteWorkout }) => {
  const getLocalMidnightToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  };
  const [selectedDate, setSelectedDate] = useState(getLocalMidnightToday());
  const [workoutsForSelectedDate, setWorkoutsForSelectedDate] = useState([]);
  const [selectedExerciseForGraph, setSelectedExerciseForGraph] = useState('');
  const [uniqueExercises, setUniqueExercises] = useState([]);
  const [overallTotalWeightForSelectedExercise, setOverallTotalWeightForSelectedExercise] = useState(0);

  useEffect(() => {
    if (allWorkouts && Array.isArray(allWorkouts) && allWorkouts.length > 0) {
      const exercises = [...new Set(allWorkouts.map(w => w.name).filter(name => name))];
      setUniqueExercises(exercises);
      // Only set default if current selection is missing or invalid
      if (exercises.length > 0 && (!selectedExerciseForGraph || !exercises.includes(selectedExerciseForGraph))) {
        setSelectedExerciseForGraph(exercises[0]);
      } else if (exercises.length === 0) {
        setSelectedExerciseForGraph('');
      }
    } else {
      setUniqueExercises([]);
      setSelectedExerciseForGraph('');
    }
    // eslint-disable-next-line
  }, [allWorkouts]); // <-- keep only allWorkouts here

  useEffect(() => {
    if (typeof getWorkoutsForDate === 'function' && selectedDate) {
      const workouts = getWorkoutsForDate(selectedDate);
      setWorkoutsForSelectedDate(Array.isArray(workouts) ? workouts : []);
    }
  }, [selectedDate, allWorkouts, getWorkoutsForDate]);

  useEffect(() => {
    if (selectedExerciseForGraph && allWorkouts) {
      const totalWeight = allWorkouts
        .filter(workout => workout.name === selectedExerciseForGraph)
        .reduce((sum, workout) => sum + (workout.weight || 0), 0);
      setOverallTotalWeightForSelectedExercise(totalWeight);
    } else {
      setOverallTotalWeightForSelectedExercise(0);
    }
  }, [selectedExerciseForGraph, allWorkouts]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="history-screen">
      {/* The main title "Workout History" is good here or could be part of a header */}
      <h1>Workout History</h1>

      {/* --- Move the summary box here, below the sign out button and above the calendar --- */}
      {selectedExerciseForGraph && overallTotalWeightForSelectedExercise > 0 && (
        <div
          className="chart-summary-box"
          style={{
            position: 'static',
            margin: '0 0 20px 0',
            top: 'unset',
            right: 'unset',
            boxShadow: 'var(--box-shadow)',
            background: 'var(--surface-dark)',
            color: 'var(--primary-text)',
          }}
        >
          <span className="summary-label">Lifetime Weight Lifted</span>
          <span className="summary-value">
            {overallTotalWeightForSelectedExercise.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} lbs
          </span>
        </div>
      )}

      <div className="calendar-container card">
        <h2 className="section-title">Select Date</h2>
        <Calendar
          onChange={handleDateChange}
          value={selectedDate}
          tileClassName={({ date, view }) => {
            if (view === 'month' && typeof getWorkoutsForDate === 'function') {
              const workoutsOnDate = getWorkoutsForDate(date);
              if (workoutsOnDate && Array.isArray(workoutsOnDate) && workoutsOnDate.length > 0) {
                return 'has-workouts';
              }
            }
            return null;
          }}
        />
      </div>

      <div className="selected-date-workouts card">
        <h2 className="section-title">Workouts on {selectedDate.toLocaleDateString()}</h2>
        <WorkoutList workouts={workoutsForSelectedDate} onDelete={deleteWorkout} />
      </div>

      <div className="progress-graph-container card">
        {uniqueExercises.length > 0 ? (
          <>
            <div className="exercise-selector-container">
              <label htmlFor="exercise-graph-select" className="exercise-select-label">Select Exercise for Graph:</label>
              <select
                id="exercise-graph-select"
                value={selectedExerciseForGraph}
                onChange={(e) => setSelectedExerciseForGraph(e.target.value)}
                className="exercise-select"
              >
                {uniqueExercises.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>

            <div className="chart-and-summary-wrapper">
              <ProgressGraph
                workouts={allWorkouts || []}
                exerciseName={selectedExerciseForGraph}
              />
            </div>
          </>
        ) : (
          <p className="graph-message">No workout data available to display a progress graph.</p>
        )}
      </div>
    </div>
  );
};

HistoryScreen.defaultProps = {
  allWorkouts: [],
  getWorkoutsForDate: () => [],
  deleteWorkout: () => {},
};

export default HistoryScreen;