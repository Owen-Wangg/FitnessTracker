// src/App.js
import React, { useState, useEffect } from 'react';
import { supabase } from './utils/supabaseClient';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import BottomNav from './components/BottomNav';
import Auth from './components/Auth';
import './assets/styles/App.css';

function App() {
  console.log("App component rendering/re-rendering");

  const [activeScreen, setActiveScreen] = useState('home');
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    const fetchWorkouts = async () => {
      if (!user) {
        console.log("fetchWorkouts: No user, clearing workouts.");
        setWorkouts([]);
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
        console.log("fetchWorkouts: Data received (first 3):", data ? data.slice(0,3).map(w=>({id:w.id, name:w.name, date:w.date})) : "No data");
        setWorkouts(data || []);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setWorkouts([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchWorkouts();
    } else {
      setWorkouts([]);
    }
  }, [user]);

  const addWorkout = async (workoutData) => {
    // ... (your existing, well-logged addWorkout function)
    // Ensure it's exactly as we refined it, with .select()
    // and proper state update: setWorkouts(prev => [data[0], ...prev])
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
      // Add any other fields you might have like notes, duration. Remove if not needed.
      // notes: workoutData.notes || null,
      // duration: workoutData.duration ? parseInt(workoutData.duration, 10) : null,
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
        setWorkouts(prevWorkouts => {
          // Prepend new workout and re-sort.
          // Supabase returns date as full ISO string (e.g., "2023-10-28T00:00:00+00:00")
          // if DB column is timestamptz.
          const updatedWorkouts = [data[0], ...prevWorkouts]
            .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending
          console.log("[ADD WORKOUT STATE UPDATE] workouts updated (new count):", updatedWorkouts.length);
          return updatedWorkouts;
        });
        setShowAddModal(false);
      } else {
        console.warn("[ADD WORKOUT WARN] Insert ok (status " + status + ") but no data returned. Check .select() or RLS for SELECT.");
        // As a fallback, you could re-fetch all workouts, but .select() should give you the data.
        // fetchWorkouts();
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

    // Optional: User confirmation
    if (!window.confirm("Are you sure you want to delete this workout? This action cannot be undone.")) {
      console.log("[DELETE WORKOUT ABORTED] User cancelled deletion.");
      return;
    }

    setLoading(true); // Indicate an operation is in progress

    try {
      console.log(`[DELETE WORKOUT INFO] Sending DELETE request to Supabase for id: ${idToDelete}`);
      const { data, error, status, statusText } = await supabase
        .from('workouts')      // Ensure this table name is 100% correct
        .delete()
        .eq('id', idToDelete); // Assumes your primary key column is named 'id'
                              // and idToDelete is the correct type (e.g., number for int8, string for uuid)

      console.log(
        "[DELETE WORKOUT RESPONSE] Supabase response received. Status:", status, statusText,
        "Data (usually null for delete):", JSON.stringify(data), // `data` is often null or an empty array for successful deletes
        "Error:", JSON.stringify(error) // Stringify error to see its structure if it's an object
      );

      if (error) {
        console.error("[DELETE WORKOUT DB ERROR] Supabase returned an error:", error);
        // Provide more specific user feedback
        if (error.message.toLowerCase().includes("row level security") || error.code === '42501' /* permission denied */) {
          alert(`Error: You do not have permission to delete this workout, or a security policy prevented it. (Details: ${error.message})`);
        } else if (status === 404) { // Not Found
          alert(`Error: Workout with ID ${idToDelete} not found. It might have already been deleted.`);
        } else {
          alert(`Error deleting workout: ${error.message} (Details: ${error.details || 'N/A'}, Hint: ${error.hint || 'N/A'})`);
        }
        // It's often good to throw the error or return a flag if you want calling code to know about the failure
        // For now, we'll just log and alert.
        return; // Stop further processing if there's an error
      }

      // If error is null, the delete was successful on the Supabase side (usually status 204 No Content)
      if (status === 204 || (status >= 200 && status < 300 && !error) ) { // Check for general success range if 204 isn't guaranteed
          console.log(`[DELETE WORKOUT SUCCESS] Workout with id: ${idToDelete} successfully processed by Supabase (Status: ${status}).`);
          // Update local state
          setWorkouts(prevWorkouts => {
              const updatedWorkouts = prevWorkouts.filter(workout => workout.id !== idToDelete);
              console.log("[DELETE WORKOUT STATE UPDATE] Local workouts state updated. New count:", updatedWorkouts.length, "Removed ID:", idToDelete);
              return updatedWorkouts;
          });
      } else {
          // This case should ideally be caught by the 'error' block, but as a fallback:
          console.warn(`[DELETE WORKOUT WARN] Delete request to Supabase for ID ${idToDelete} had an unexpected status: ${status}. Error object:`, error);
          alert(`The workout deletion might not have completed successfully (Status: ${status}). Please refresh and check.`);
      }

    } catch (catchError) {
      // This catches errors in the try block that are not Supabase errors (e.g., network issues before request)
      console.error("[DELETE WORKOUT CATCH ERROR] An exception occurred in the deleteWorkout try-catch block:", catchError);
      alert('An unexpected error occurred while trying to delete the workout. Please check your connection and try again.');
    } finally {
      setLoading(false); // Stop indicating an operation is in progress
      console.log("[DELETE WORKOUT END] Function execution finished.");
    }
  };

  const getTodaysWorkouts = () => {
    if (!user) return [];
    const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

    console.log("[GET TODAY'S WORKOUTS] Filtering for date:", todayStr);
    // console.log("[GET TODAY'S WORKOUTS] Full workouts state (first 3):", workouts.slice(0,3).map(w=>({id:w.id,date:w.date,name:w.name})));

    const filtered = workouts.filter(w => {
      if (!w || !w.date) {
        // console.warn("[GET TODAY'S WORKOUTS] Filtering out item with no date:", w);
        return false;
      }
      // Assuming w.date from Supabase (via workouts state) is a full ISO string like "2023-10-28T00:00:00+00:00"
      // because the 'date' column in Supabase is 'timestamptz'.
      const workoutDateMatches = w.date.startsWith(todayStr);
      // if (!workoutDateMatches && w.date.includes(todayStr.substring(0,7))) { // Log if month is same to reduce noise
      //    console.log(`[GET TODAY'S WORKOUTS] Mismatch: DB date "${w.date}" vs today "${todayStr}" for ID ${w.id}`);
      // }
      return workoutDateMatches;
    });
    console.log("[GET TODAY'S WORKOUTS] Filtered result count:", filtered.length);
    return filtered;
  };

  const getWorkoutsForDate = (selectedDateObj) => { // selectedDateObj is a Date object from react-calendar
    if (!user || !selectedDateObj) return [];
    const selectedDateStr = selectedDateObj.toISOString().split('T')[0]; // "YYYY-MM-DD"

    console.log("[GET WORKOUTS FOR DATE] Filtering for date:", selectedDateStr);
    // console.log("[GET WORKOUTS FOR DATE] Full workouts state (first 3):", workouts.slice(0,3).map(w=>({id:w.id,date:w.date,name:w.name})));

    const filtered = workouts.filter(w => {
      if (!w || !w.date) {
        // console.warn("[GET WORKOUTS FOR DATE] Filtering out item with no date:", w);
        return false;
      }
      const workoutDateMatches = w.date.startsWith(selectedDateStr);
      // if (!workoutDateMatches && w.date.includes(selectedDateStr.substring(0,7))) {
      //    console.log(`[GET WORKOUTS FOR DATE] Mismatch: DB date "${w.date}" vs selected "${selectedDateStr}" for ID ${w.id}`);
      // }
      return workoutDateMatches;
    });
    console.log("[GET WORKOUTS FOR DATE] Filtered result count:", filtered.length);
    return filtered;
  };

  const handleSignOut = async () => {
    console.log("[SIGN OUT START] Attempting to sign out.");
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[SIGN OUT ERROR]', error);
      alert('Error signing out: ' + error.message);
    } else {
      console.log("[SIGN OUT SUCCESS] User signed out. Session & user will be cleared by onAuthStateChange.");
      // setSession(null); // Not strictly needed, onAuthStateChange handles it
      // setUser(null);
      // setWorkouts([]);
      setActiveScreen('home'); // Or redirect appropriately
    }
    // setLoading(false); // onAuthStateChange will set loading to false after session update
    console.log("[SIGN OUT END]");
  };

  // console.log("App.js state before render: ", { loading, session: !!session, userId: user?.id, workoutsCount: workouts.length });

  if (loading && !session && !user) {
    console.log("Rendering: Initial loading state");
    return <div className="loading-app">Loading Fitness Tracker...</div>;
  }

  if (!session || !user) {
    console.log("Rendering: Auth component");
    return <Auth />;
  }

  console.log("Rendering: Main app content for user:", user.id);
  return (
    <div className="app-container">
      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 1001}}>
        <button onClick={handleSignOut} style={{/* your styles */}}>Sign Out</button>
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
            // isLoading prop for specific sections if needed
            // isLoading={loading && workouts.length === 0 && !!user} // More general loading
          />
        )}
        {activeScreen === 'history' && (
          <HistoryScreen
            allWorkouts={workouts} // Pass the full, sorted list
            getWorkoutsForDate={getWorkoutsForDate} // Pass the function for dynamic filtering
            deleteWorkout={deleteWorkout}
            // isLoading={loading && workouts.length === 0 && !!user}
          />
        )}
      </main>
      <BottomNav activeScreen={activeScreen} onNavigate={setActiveScreen} />
    </div>
  );
}

export default App;