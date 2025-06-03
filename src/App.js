// src/App.js
import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen'; // <<<--- IMPORT
import BottomNav from './components/BottomNav';
import Auth from './components/Auth';
import './assets/styles/App.css';

function App() {
  // ... (all your existing state and useEffects, addWorkout, deleteWorkout, etc.) ...
  const [activeScreen, setActiveScreen] = useState('home');
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- Placeholder for lifetime stats ---
  // In a real app, you'd calculate this or fetch it
  const [lifetimeStats, setLifetimeStats] = useState({ totalWeightLifted: 0 });

  useEffect(() => {
    // ... your existing auth useEffect ...
    console.log("Initial session check useEffect running");
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log("getSession completed, session:", currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }).catch(error => {
      console.error("Error in getSession:", error);
      setLoading(false);
    });

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        console.log("onAuthStateChange triggered, newSession:", newSession, "Event:", _event);
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      console.log("Cleaning up auth listener");
      authListener?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // ... your existing fetchWorkouts useEffect ...
    const fetchWorkouts = async () => {
      if (!user) {
        console.log("fetchWorkouts: No user, clearing workouts and stats.");
        setWorkouts([]);
        setLifetimeStats({ totalWeightLifted: 0 }); // Reset stats on logout
        return;
      }
      console.log("fetchWorkouts: Fetching for user:", user.id);
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('workouts')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (error) throw error;
        console.log("fetchWorkouts: Data received");
        setWorkouts(data || []);

        // Calculate lifetime total weight lifted
        if (data) {
          const totalLifted = data.reduce((sum, workout) => {
            const weight = parseFloat(workout.weight) || 0;
            const sets = parseInt(workout.sets, 10) || 0;
            const reps = parseInt(workout.reps, 10) || 0;
            return sum + (weight * sets * reps);
          }, 0);
          setLifetimeStats({ totalWeightLifted: totalLifted });
          console.log("fetchWorkouts: Calculated lifetime total weight:", totalLifted);
        }

      } catch (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
        setLifetimeStats({ totalWeightLifted: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWorkouts();
    } else {
      setWorkouts([]);
      setLifetimeStats({ totalWeightLifted: 0 });
    }
  }, [user]);


  const addWorkout = async (workoutData) => {
    // ... your existing addWorkout function ...
    // After successful add, you might want to re-calculate lifetime stats
    // or update it incrementally. For simplicity now, fetchWorkouts will re-calc.
    // To do it incrementally:
    // if (data && data.length > 0) {
    //   ... setWorkouts ...
    //   const addedWeight = (parseFloat(data[0].weight) || 0) * (parseInt(data[0].sets, 10) || 0) * (parseInt(data[0].reps, 10) || 0);
    //   setLifetimeStats(prevStats => ({
    //     ...prevStats,
    //     totalWeightLifted: prevStats.totalWeightLifted + addedWeight
    //   }));
    // }
    // For now, relying on the full fetchWorkouts on user change is simpler.
    // If you add a workout and want immediate stat update, you'd call fetchWorkouts()
    // or implement incremental update.

    // Let's keep your existing addWorkout logic for now.
    // The lifetime stats will update when 'workouts' state is refetched/updated.
    // A more direct update would be to call fetchWorkouts() after a successful add,
    // or manually update lifetimeStats.
    console.log("[ADD WORKOUT START] Function called with workoutData:", JSON.stringify(workoutData));

    if (!user) {
      console.error("[ADD WORKOUT ERROR] No user logged in. Aborting.");
      alert("You must be logged in to add a workout.");
      return;
    }
    console.log("[ADD WORKOUT INFO] Current user.id:", user.id, "(Type:", typeof user.id + ")");

    const newWorkout = {
      user_id: user.id,
      date: workoutData.date || new Date().toISOString().split('T')[0],
      name: workoutData.name,
      weight: workoutData.weight ? parseInt(workoutData.weight, 10) : null,
      sets: workoutData.sets ? parseInt(workoutData.sets, 10) : null,
      reps: workoutData.reps ? parseInt(workoutData.reps, 10) : null,
    };

    console.log("[ADD WORKOUT INFO] Prepared newWorkout object for Supabase:", JSON.stringify(newWorkout));

    if (!newWorkout.name || !newWorkout.date) {
      console.error("[ADD WORKOUT ERROR] Missing required fields (name or date). Aborting.", JSON.stringify(newWorkout));
      alert("Exercise Name and Date are required.");
      return;
    }

    console.log("[ADD WORKOUT INFO] Attempting Supabase insert...");
    try {
      setLoading(true);
      const { data, error, status, statusText } = await supabase
        .from('workouts')
        .insert([newWorkout])
        .select();

      console.log(
        "[ADD WORKOUT RESPONSE] Supabase response. Status:", status, statusText,
        "Data:", JSON.stringify(data),
        "Error:", JSON.stringify(error)
      );

      if (error) {
        console.error("[ADD WORKOUT DB ERROR]", error);
        alert(`Error adding workout: ${error.message}`);
        return;
      }

      if (data && data.length > 0) {
        console.log("[ADD WORKOUT SUCCESS] data[0]:", JSON.stringify(data[0]));
        // Update workouts state
        setWorkouts(prevWorkouts => {
          const updatedWorkouts = [data[0], ...prevWorkouts]
            .sort((a, b) => new Date(b.date) - new Date(a.date));
          console.log("[ADD WORKOUT STATE UPDATE] workouts updated (new count):", updatedWorkouts.length);
          return updatedWorkouts;
        });
        // After workouts state is updated, recalculate lifetime stats
        // This is a bit indirect. A better way would be to update lifetimeStats directly here
        // or ensure fetchWorkouts is called if it's not already triggered.
        // For now, this will rely on the fact that if `workouts` changes,
        // and if `lifetimeStats` was derived from `workouts` in a useEffect, it would update.
        // Since we calculate it in fetchWorkouts, let's trigger a re-fetch or recalculate.
        const currentWorkouts = [data[0], ...workouts]; // use current workouts state for immediate calculation
        const totalLifted = currentWorkouts.reduce((sum, workout) => {
            const weight = parseFloat(workout.weight) || 0;
            const sets = parseInt(workout.sets, 10) || 0;
            const reps = parseInt(workout.reps, 10) || 0;
            return sum + (weight * sets * reps);
        }, 0);
        setLifetimeStats({ totalWeightLifted: totalLifted });
        console.log("[ADD WORKOUT] Recalculated lifetime total weight:", totalLifted);


        setShowAddModal(false);
      } else {
        console.warn("[ADD WORKOUT WARN] Insert ok (status " + status + ") but no data returned.");
      }
    } catch (catchError) {
      console.error("[ADD WORKOUT CATCH ERROR]", catchError);
      alert('An unexpected error occurred while adding workout.');
    } finally {
      setLoading(false);
      console.log("[ADD WORKOUT END]");
    }
  };


  const deleteWorkout = async (idToDelete) => {
    if (!idToDelete) {
      console.error("[DELETE WORKOUT ERROR] No ID provided to deleteWorkout function. Aborting.");
      alert("Cannot delete workout: No ID specified.");
      return;
    }

    console.log(`[DELETE WORKOUT START] Attempting to delete workout with id: ${idToDelete}`);

    if (!window.confirm("Are you sure you want to delete this workout? This action cannot be undone.")) {
      console.log("[DELETE WORKOUT ABORTED] User cancelled deletion.");
      return;
    }

    setLoading(true);

    try {
      console.log(`[DELETE WORKOUT INFO] Sending DELETE request to Supabase for id: ${idToDelete}`);
      const { data, error, status, statusText } = await supabase
        .from('workouts')
        .delete()
        .eq('id', idToDelete);

      console.log(
        "[DELETE WORKOUT RESPONSE] Supabase response received. Status:", status, statusText,
        "Data (usually null for delete):", JSON.stringify(data),
        "Error:", JSON.stringify(error)
      );

      if (error) {
        console.error("[DELETE WORKOUT DB ERROR] Supabase returned an error:", error);
        alert(`Error deleting workout: ${error.message}`);
        return;
      }

      if (status === 204 || (status >= 200 && status < 300 && !error) ) {
        console.log(`[DELETE WORKOUT SUCCESS] Workout with id: ${idToDelete} successfully processed by Supabase (Status: ${status}).`);
        setWorkouts(prevWorkouts => {
          const remainingWorkouts = prevWorkouts.filter(workout => workout.id !== idToDelete);
          // Recalculate lifetime stats based on the new workouts list
          const totalLifted = remainingWorkouts.reduce((sum, workout) => {
            const weight = parseFloat(workout.weight) || 0;
            const sets = parseInt(workout.sets, 10) || 0;
            const reps = parseInt(workout.reps, 10) || 0;
            return sum + (weight * sets * reps);
          }, 0);
          setLifetimeStats({ totalWeightLifted: totalLifted });
          console.log("[DELETE WORKOUT] Recalculated lifetime total weight:", totalLifted);
          return remainingWorkouts;
        });
      } else {
        console.warn(`[DELETE WORKOUT WARN] Delete request to Supabase for ID ${idToDelete} had an unexpected status: ${status}. Error object:`, error);
        alert(`The workout deletion might not have completed successfully (Status: ${status}). Please refresh and check.`);
      }

    } catch (catchError) {
      console.error("[DELETE WORKOUT CATCH ERROR] An exception occurred in the deleteWorkout try-catch block:", catchError);
      alert('An unexpected error occurred while trying to delete the workout. Please check your connection and try again.');
    } finally {
      setLoading(false);
      console.log("[DELETE WORKOUT END] Function execution finished.");
    }
  };

  const getTodaysWorkouts = () => {
    // ... your existing getTodaysWorkouts function ...
    if (!user) return [];
    const now = new Date();
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000 ))
                      .toISOString()
                      .split('T')[0];

    // console.log("[GET TODAY'S WORKOUTS] Filtering for LOCAL date (todayStr):", todayStr);
    const filtered = workouts.filter(w => {
      if (!w || !w.date) return false;
      return w.date.startsWith(todayStr);
    });
    // console.log("[GET TODAY'S WORKOUTS] Filtered result count for local today:", filtered.length);
    return filtered;
  };

  const getWorkoutsForDate = (selectedDateObj) => {
    // ... your existing getWorkoutsForDate function ...
    if (!user || !selectedDateObj) return [];
    const selectedDateStr = selectedDateObj.toISOString().split('T')[0];

    // console.log("[GET WORKOUTS FOR DATE] Filtering for date (selectedDateStr):", selectedDateStr);
    const filtered = workouts.filter(w => {
      if (!w || !w.date) return false;
      return w.date.startsWith(selectedDateStr);
    });
    // console.log("[GET WORKOUTS FOR DATE] Filtered result count:", filtered.length);
    return filtered;
  };

  const handleSignOut = async () => {
    // ... your existing handleSignOut function ...
    console.log("[SIGN OUT START] Attempting to sign out.");
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[SIGN OUT ERROR]', error);
      alert('Error signing out: ' + error.message);
    } else {
      console.log("[SIGN OUT SUCCESS] User signed out.");
      setActiveScreen('home');
    }
    console.log("[SIGN OUT END]");
  };

  // ... (loading and auth checks) ...
  if (loading && !session && !user) {
    return <div className="loading-app">Loading Fitness Tracker...</div>;
  }

  if (!session || !user) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1001 }}>
        {/* This sign out button is global to App.js */}
        {/* <button onClick={handleSignOut} className="global-sign-out-btn">Sign Out (Global)</button> */}
      </div>

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
        {/* --- ADD PROFILE SCREEN RENDER --- */}
        {activeScreen === 'profile' && (
          <ProfileScreen
            user={user} // Pass user object for display name/email
            handleSignOut={handleSignOut} // Pass the sign out function
            lifetimeStats={lifetimeStats} // Pass calculated stats
          />
        )}
      </main>
      {/* Ensure BottomNav has a way to navigate to 'profile' */}
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  );
}

export default App;