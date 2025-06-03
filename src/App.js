// src/App.js
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import BottomNav from './components/BottomNav';
import { getWorkoutsFromStorage, saveWorkoutsToStorage } from './utils/storage';
import './assets/styles/App.css'; // Specific styles for App layout

function App() {
  const [activeScreen, setActiveScreen] = useState('home'); // 'home' or 'history'
  const [workouts, setWorkouts] = useState(getWorkoutsFromStorage()); // All workouts
  const [showAddModal, setShowAddModal] = useState(false);

  // Save workouts to localStorage whenever they change
  useEffect(() => {
    saveWorkoutsToStorage(workouts);
  }, [workouts]);

  const addWorkout = (workoutData) => {
    const newWorkout = {
      id: uuidv4(),
      date: new Date().toISOString(), // Store date in ISO format
      ...workoutData, // name, weight, sets, reps
    };
    setWorkouts(prevWorkouts => [...prevWorkouts, newWorkout]);
    setShowAddModal(false); // Close modal after adding
  };

  const deleteWorkout = (id) => {
    setWorkouts(prevWorkouts => prevWorkouts.filter(workout => workout.id !== id));
  };

  // Filter workouts for today
  const getTodaysWorkouts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0); // Start of workout day
      return workoutDate.getTime() === today.getTime();
    });
  };

  // Filter workouts for a specific date
  const getWorkoutsForDate = (selectedDate) => {
    if (!selectedDate) return [];
    const targetDate = new Date(selectedDate);
    targetDate.setHours(0, 0, 0, 0);

    return workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === targetDate.getTime();
    });
  };

  return (
    <div className="app-container">
      <main className="content-area">
        {activeScreen === 'home' && (
          <HomeScreen
            todaysWorkouts={getTodaysWorkouts()}
            onAddWorkoutClick={() => setShowAddModal(true)}
            showAddModal={showAddModal}
            setShowAddModal={setShowAddModal}
            addWorkout={addWorkout}
            deleteWorkout={deleteWorkout}
          />
        )}
        {activeScreen === 'history' && (
          <HistoryScreen
            allWorkouts={workouts}
            getWorkoutsForDate={getWorkoutsForDate}
            deleteWorkout={deleteWorkout}
          />
        )}
      </main>
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  );
}

export default App;