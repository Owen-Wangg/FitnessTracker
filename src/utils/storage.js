// src/utils/storage.js
const WORKOUTS_KEY = 'fitnessTrackerWorkouts';

export const getWorkoutsFromStorage = () => {
  const storedWorkouts = localStorage.getItem(WORKOUTS_KEY);
  return storedWorkouts ? JSON.parse(storedWorkouts) : [];
};

export const saveWorkoutsToStorage = (workouts) => {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
};