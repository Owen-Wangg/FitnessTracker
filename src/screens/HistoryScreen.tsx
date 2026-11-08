import React, { useMemo, useState } from 'react';
import { DayPicker } from '@daypicker/react';
import '@daypicker/react/style.css';
import WorkoutList from '../components/WorkoutList';
import ProgressGraph from '../components/ProgressGraph';
import { formatLocalDate, parseLocalDate } from '../utils/workoutMetrics';
import { longDate } from '../utils/format';
import { exerciseOptions } from '../utils/exerciseLibrary';
import type { Workout } from '../types';
import '../assets/styles/HistoryScreen.css';

interface HistoryScreenProps {
  allWorkouts?: Workout[];
  loading?: boolean;
  deleteWorkout?: (id: string) => void;
  onEditWorkout?: (workout: Workout) => void;
}

const HistoryScreen = ({ allWorkouts = [], loading = false, deleteWorkout = () => {}, onEditWorkout }: HistoryScreenProps) => {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [chosenExercise, setChosenExercise] = useState('');

  // Days that have at least one workout, for the calendar dots.
  const trainedDays = useMemo(
    () => [...new Set(allWorkouts.map((w) => w.date))].map(parseLocalDate),
    [allWorkouts]
  );

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
        <DayPicker
          mode="single"
          required
          selected={selectedDate}
          onSelect={setSelectedDate}
          defaultMonth={selectedDate}
          showOutsideDays
          modifiers={{ trained: trainedDays }}
          modifiersClassNames={{ trained: 'has-workouts' }}
        />
      </div>

      <div className="selected-date-workouts card">
        <h2 className="section-title">Workouts on {longDate(formatLocalDate(selectedDate))}</h2>
        <WorkoutList workouts={workoutsForSelectedDate} onDelete={deleteWorkout} onEdit={onEditWorkout} loading={loading} />
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
