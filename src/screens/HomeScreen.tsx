import React from 'react';
import SummaryCard from '../components/SummaryCard';
import WeekStrip from '../components/WeekStrip';
import MonthSummary from '../components/MonthSummary';
import WorkoutList from '../components/WorkoutList';
import { FaPlus } from 'react-icons/fa';
import type { Workout } from '../types';
import '../assets/styles/HomeScreen.css';

interface HomeScreenProps {
  todaysWorkouts: Workout[];
  allWorkouts: Workout[];
  loading?: boolean;
  onAddWorkoutClick: () => void;
  onEditWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
}

const HomeScreen = ({
  todaysWorkouts,
  allWorkouts,
  loading,
  onAddWorkoutClick,
  onEditWorkout,
  deleteWorkout
}: HomeScreenProps) => {
  return (
    <div className="home-screen">
      <div className="home-header">
        <h1>Today's Workouts</h1>
        <button className="add-workout-btn-header" onClick={onAddWorkoutClick}>
          <FaPlus /> Add
        </button>
      </div>

      <div className="home-dashboard">
        <SummaryCard workouts={todaysWorkouts} />
        <WeekStrip workouts={allWorkouts} />
        {allWorkouts.length > 0 && <MonthSummary workouts={allWorkouts} />}
      </div>

      <WorkoutList workouts={todaysWorkouts} onDelete={deleteWorkout} onEdit={onEditWorkout} loading={loading} />

    </div>
  );
};

export default HomeScreen;
