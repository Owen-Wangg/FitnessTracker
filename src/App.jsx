// src/App.js
import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useWorkouts } from './hooks/useWorkouts';
import { useBodyWeights } from './hooks/useBodyWeights';
import { totalVolume, formatLocalDate } from './utils/workoutMetrics';
import HomeScreen from './screens/HomeScreen';
import BottomNav from './components/BottomNav';
import Auth from './components/Auth';
import LoadError from './components/LoadError';
import './assets/styles/App.css';

// The chart screens load on demand so Home opens without downloading Chart.js.
const HistoryScreen = lazy(() => import('./screens/HistoryScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));

function App() {
  const { session, user, loading, recovering, clearRecovery, signOut } = useAuth();
  const { workouts, status, reload, addWorkout, deleteWorkout } = useWorkouts(user);
  const { bodyWeights, logBodyWeight, deleteBodyWeight } = useBodyWeights(user);

  const loadingWorkouts = status === 'loading';
  const [showAddModal, setShowAddModal] = useState(false);

  const lifetimeStats = useMemo(
    () => ({ totalWeightLifted: totalVolume(workouts) }),
    [workouts]
  );

  const todaysWorkouts = useMemo(() => {
    const today = formatLocalDate(new Date());
    return workouts.filter((w) => w.date === today);
  }, [workouts]);

  const handleAddWorkout = async (workoutData) => {
    const ok = await addWorkout(workoutData);
    if (ok) setShowAddModal(false);
    return ok;
  };

  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (await signOut()) navigate('/');
  };

  if (loading && !session) {
    return <div className="loading-app">Loading Fitness Tracker...</div>;
  }

  if (recovering && session) {
    return <Auth recoveryMode onPasswordUpdated={clearRecovery} />;
  }

  if (!session || !user) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <main className="content-area">
        {status === 'error' && <LoadError onRetry={reload} />}
        <Suspense fallback={<div className="loading-app">Loading...</div>}>
        <Routes>
          <Route
            path="/"
            element={
              <HomeScreen
                todaysWorkouts={todaysWorkouts}
                allWorkouts={workouts}
                loading={loadingWorkouts}
                onAddWorkoutClick={() => setShowAddModal(true)}
                showAddModal={showAddModal}
                setShowAddModal={setShowAddModal}
                addWorkout={handleAddWorkout}
                deleteWorkout={deleteWorkout}
              />
            }
          />
          <Route
            path="/history"
            element={<HistoryScreen allWorkouts={workouts} loading={loadingWorkouts} deleteWorkout={deleteWorkout} />}
          />
          <Route
            path="/profile"
            element={
              <ProfileScreen
                user={user}
                handleSignOut={handleSignOut}
                lifetimeStats={lifetimeStats}
                bodyWeights={bodyWeights}
                onLogBodyWeight={logBodyWeight}
                onDeleteBodyWeight={deleteBodyWeight}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}

export default App;
