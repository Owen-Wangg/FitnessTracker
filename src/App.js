// src/App.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './utils/supabaseClient';
import { totalVolume, formatLocalDate } from './utils/workoutMetrics';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import BottomNav from './components/BottomNav';
import Auth from './components/Auth';
import './assets/styles/App.css';

// A workout entry is one exercise on one date, with its sets nested:
//   { id, date, name, sets: [{ id, set_number, weight, reps, set_type }] }
const SET_COLUMNS = 'id, set_number, weight, reps, set_type';

const normalizeWorkout = (row, sets) => ({
  id: row.id,
  date: row.date,
  name: row.name,
  sets: [...(sets || [])]
    .sort((a, b) => a.set_number - b.set_number)
    .map((s) => ({ ...s, weight: Number(s.weight) })),
});

const sortNewestFirst = (list) => [...list].sort((a, b) => b.date.localeCompare(a.date));

function App() {
  const [activeScreen, setActiveScreen] = useState('home');
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const lifetimeStats = useMemo(
    () => ({ totalWeightLifted: totalVolume(workouts) }),
    [workouts]
  );

  const exerciseNames = useMemo(() => {
    const byLower = new Map();
    workouts.forEach((w) => {
      const key = w.name.trim().toLowerCase();
      if (key && !byLower.has(key)) byLower.set(key, w.name.trim());
    });
    return [...byLower.values()].sort((a, b) => a.localeCompare(b));
  }, [workouts]);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
      })
      .catch((error) => console.error('Error in getSession:', error))
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setWorkouts([]);
      return;
    }

    let cancelled = false;
    const fetchWorkouts = async () => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .select(`id, date, name, workout_sets (${SET_COLUMNS})`)
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: true });

      if (cancelled) return;
      if (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
        return;
      }
      setWorkouts((data || []).map((row) => normalizeWorkout(row, row.workout_sets)));
    };

    fetchWorkouts();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // workoutData: { name, date, sets: [{ weight, reps }] }. Resolves true on success.
  const addWorkout = async (workoutData) => {
    if (!user) {
      alert('You must be logged in to add a workout.');
      return false;
    }

    const name = (workoutData.name || '').trim();
    const date = workoutData.date || formatLocalDate(new Date());
    const sets = workoutData.sets || [];
    if (!name || !date || sets.length === 0) {
      alert('Exercise name, date and at least one set are required.');
      return false;
    }

    try {
      const { data: exercise, error: exerciseError } = await supabase
        .from('workout_exercises')
        .insert({ user_id: user.id, date, name })
        .select('id, date, name')
        .single();
      if (exerciseError) throw exerciseError;

      const { data: insertedSets, error: setsError } = await supabase
        .from('workout_sets')
        .insert(
          sets.map((s, i) => ({
            workout_exercise_id: exercise.id,
            user_id: user.id,
            set_number: i + 1,
            weight: s.weight,
            reps: s.reps,
          }))
        )
        .select(SET_COLUMNS);

      if (setsError) {
        // Don't leave an exercise with no sets behind.
        await supabase.from('workout_exercises').delete().eq('id', exercise.id);
        throw setsError;
      }

      setWorkouts((prev) => sortNewestFirst([normalizeWorkout(exercise, insertedSets), ...prev]));
      setShowAddModal(false);
      return true;
    } catch (error) {
      console.error('Error adding workout:', error);
      alert(`Error adding workout: ${error.message}`);
      return false;
    }
  };

  const deleteWorkout = async (idToDelete) => {
    if (!idToDelete) return;
    if (!window.confirm('Are you sure you want to delete this workout? This action cannot be undone.')) {
      return;
    }

    // Sets are removed by the foreign key's ON DELETE CASCADE.
    const { error } = await supabase.from('workout_exercises').delete().eq('id', idToDelete);
    if (error) {
      console.error('Error deleting workout:', error);
      alert(`Error deleting workout: ${error.message}`);
      return;
    }
    setWorkouts((prev) => prev.filter((w) => w.id !== idToDelete));
  };

  const getWorkoutsForDate = useCallback(
    (dateObj) => {
      if (!user || !dateObj) return [];
      const dateStr = formatLocalDate(dateObj);
      return workouts.filter((w) => w.date === dateStr);
    },
    [user, workouts]
  );

  const todaysWorkouts = useMemo(
    () => getWorkoutsForDate(new Date()),
    [getWorkoutsForDate]
  );

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      alert('Error signing out: ' + error.message);
    } else {
      setActiveScreen('home');
    }
  };

  if (loading && !session && !user) {
    return <div className="loading-app">Loading Fitness Tracker...</div>;
  }

  if (!session || !user) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <main className="content-area">
        {activeScreen === 'home' && (
          <HomeScreen
            todaysWorkouts={todaysWorkouts}
            exerciseNames={exerciseNames}
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
        {activeScreen === 'profile' && (
          <ProfileScreen
            user={user}
            handleSignOut={handleSignOut}
            lifetimeStats={lifetimeStats}
          />
        )}
      </main>
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  );
}

export default App;
