// src/App.tsx
import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useWorkouts } from './hooks/useWorkouts';
import { useBodyWeights } from './hooks/useBodyWeights';
import { useTheme } from './hooks/useTheme';
import { totalVolume, formatLocalDate } from './utils/workoutMetrics';
import type { Workout, WorkoutDraft } from './types';
import HomeScreen from './screens/HomeScreen';
import WorkoutFormModal from './components/WorkoutFormModal';
import BottomNav from './components/BottomNav';
import Auth from './components/Auth';
import LoadError from './components/LoadError';
import './assets/styles/App.css';

// The chart screens load on demand so Home opens without downloading Chart.js.
const HistoryScreen = lazy(() => import('./screens/HistoryScreen'));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));

function App() {
  const { session, user, loading, recovering, clearRecovery, signOut } = useAuth();
  const { workouts, status, reload, addWorkout, updateWorkout, deleteWorkout } = useWorkouts(user);
  const { bodyWeights, logBodyWeight, deleteBodyWeight } = useBodyWeights(user);
  const { preference: themePreference, setPreference: setThemePreference } = useTheme();

  const loadingWorkouts = status === 'loading';
  // null = closed; { workout: null } = adding; { workout } = editing that entry
  const [form, setForm] = useState<{ workout: Workout | null } | null>(null);

  const lifetimeStats = useMemo(
    () => ({ totalWeightLifted: totalVolume(workouts) }),
    [workouts]
  );

  const todaysWorkouts = useMemo(() => {
    const today = formatLocalDate(new Date());
    return workouts.filter((w) => w.date === today);
  }, [workouts]);

  const handleSubmitForm = async (workoutData: WorkoutDraft): Promise<boolean> => {
    if (!form) return false;
    const ok = form.workout ? await updateWorkout(form.workout.id, workoutData) : await addWorkout(workoutData);
    if (ok) setForm(null);
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
                onAddWorkoutClick={() => setForm({ workout: null })}
                onEditWorkout={(workout) => setForm({ workout })}
                deleteWorkout={deleteWorkout}
              />
            }
          />
          <Route
            path="/history"
            element={
              <HistoryScreen
                allWorkouts={workouts}
                loading={loadingWorkouts}
                deleteWorkout={deleteWorkout}
                onEditWorkout={(workout) => setForm({ workout })}
              />
            }
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
                themePreference={themePreference}
                onThemeChange={setThemePreference}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </main>
      <BottomNav />
      {form && (
        <WorkoutFormModal
          key={form.workout?.id ?? 'new'}
          initial={form.workout}
          onClose={() => setForm(null)}
          onSubmit={handleSubmitForm}
        />
      )}
    </div>
  );
}

export default App;
