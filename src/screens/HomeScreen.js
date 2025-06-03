import React from 'react';
import SummaryCard from '../components/SummaryCard';
import WorkoutList from '../components/WorkoutList';
import AddWorkoutModal from '../components/AddWorkoutModal';
import { FaPlus } from 'react-icons/fa';
import '../assets/styles/HomeScreen.css';

const HomeScreen = ({
  todaysWorkouts,
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

      <SummaryCard workouts={todaysWorkouts} />
      <WorkoutList workouts={todaysWorkouts} onDelete={deleteWorkout} />

      {/* Floating Action Button (alternative or additional) */}
      {/* <button className="fab" onClick={onAddWorkoutClick}>
        <FaPlus size={24} />
      </button> */}

      <AddWorkoutModal
        show={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddWorkout={addWorkout}
      />
    </div>
  );
};

export default HomeScreen;