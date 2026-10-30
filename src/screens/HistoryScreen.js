import React, { useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import WorkoutList from '../components/WorkoutList';
import ProgressGraph from '../components/ProgressGraph';
import { formatLocalDate } from '../utils/workoutMetrics';
import { exerciseOptions } from '../utils/exerciseLibrary';
import '../assets/styles/HistoryScreen.css';

const HistoryScreen = ({ allWorkouts = [], deleteWorkout = () => {} }) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [chosenExercise, setChosenExercise] = useState('');

  // Days that have at least one workout, for the calendar dots.
  const trainedDates = useMemo(() => new Set(allWorkouts.map((w) => w.date)), [allWorkouts]);

  const workoutsForSelectedDate = useMemo(() => {
    const day = formatLocalDate(selectedDate);
    return allWorkouts.filter((w) => w.date === day);
  }, [allWorkouts, selectedDate]);

  const options = useMemo(() => exerciseOptions(allWorkouts), [allWorkouts]);

  // Fall back to the most recent exercise when nothing valid is chosen (e.g. after a delete).
  const selected = options.find((o) => o.key === chosenExercise) || options[0] || null;

  return (
    <div className="history-screen">
      <h1>Workout History</h1>
      <div className="calendar-container card">
        <h2 className="section-title">Select Date</h2>
        <Calendar
          onChange={setSelectedDate}
          value={selectedDate}
          tileClassName={({ date, view }) =>
            view === 'month' && trainedDates.has(formatLocalDate(date)) ? 'has-workouts' : null
          }
        />
      </div>

      <div className="selected-date-workouts card">
        <h2 className="section-title">Workouts on {selectedDate.toLocaleDateString()}</h2>
        <WorkoutList workouts={workoutsForSelectedDate} onDelete={deleteWorkout} />
      </div>

      <div className="progress-graph-container card">
        {selected ? (
          <>
            <div className="exercise-selector-container">
              <label htmlFor="exercise-graph-select" className="exercise-select-label">
                Select Exercise for Graph:
              </label>
              <select
                id="exercise-graph-select"
                value={selected.key}
                onChange={(e) => setChosenExercise(e.target.value)}
                className="exercise-select"
              >
                {options.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>

            <ProgressGraph
              workouts={allWorkouts}
              exerciseKey={selected.key}
              exerciseLabel={selected.label}
            />
          </>
        ) : (
          <p className="graph-message">No workout data available to display a progress graph.</p>
        )}
      </div>
    </div>
  );
};

export default HistoryScreen;
