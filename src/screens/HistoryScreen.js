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

  useEffect(() => {
    if (allWorkouts && Array.isArray(allWorkouts) && allWorkouts.length > 0) {
      const exercises = [...new Set(allWorkouts.map(w => w.name).filter(name => name))];
      setUniqueExercises(exercises);
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
  }, [allWorkouts]);


  useEffect(() => {
    if (typeof getWorkoutsForDate === 'function' && selectedDate) {
      const workouts = getWorkoutsForDate(selectedDate);
      setWorkoutsForSelectedDate(Array.isArray(workouts) ? workouts : []);
    }
  }, [selectedDate, allWorkouts, getWorkoutsForDate]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  return (
    <div className="history-screen">
      <h1>Workout History</h1>
      <div className="calendar-container card">
        <h2 className="section-title">Select Date</h2>
        <Calendar
          // ... props ...
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

            {/* The wrapper below might not be needed if the summary box inside it is also gone,
                unless ProgressGraph itself needs a relative parent for internal positioning. */}
            <div className="chart-and-summary-wrapper">
              <ProgressGraph
                workouts={allWorkouts || []}
                exerciseName={selectedExerciseForGraph}
              />
              {/* The other instance of chart-summary-box was removed previously or would also be removed now */}
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