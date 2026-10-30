import React from 'react';
import SummaryCard from '../components/SummaryCard';
import WeekStrip from '../components/WeekStrip';
import WorkoutList from '../components/WorkoutList';
import AddWorkoutModal from '../components/AddWorkoutModal';
import { FaPlus } from 'react-icons/fa';
import '../assets/styles/HomeScreen.css';

const HomeScreen = ({
  todaysWorkouts,
  allWorkouts,
  recentExercises,
  onAddWorkoutClick,
  showAddModal,
  setShowAddModal,
  addWorkout,
  deleteWorkout
}) => {
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
      </div>

      <WorkoutList workouts={todaysWorkouts} onDelete={deleteWorkout} />

      <AddWorkoutModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddWorkout={addWorkout}
        recentExercises={recentExercises}
      />
    </div>
  );
};

export default HomeScreen;
