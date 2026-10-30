import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../components/ToastProvider';
import { formatLocalDate } from '../utils/workoutMetrics';
import { SET_COLUMNS, normalizeWorkout, sortNewestFirst } from '../utils/workoutData';

export const UNDO_MS = 6000;

// PostgREST reports an uninstalled function as PGRST202 (or says it could not find it).
const isMissingFunction = (error) =>
  error?.code === 'PGRST202' || /could not find the function/i.test(error?.message || '');

// The signed-in user's workout entries (newest first) and the actions on them.
//   status: 'idle' (no user) | 'loading' | 'ready' | 'error'
export const useWorkouts = (user) => {
  const toast = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [status, setStatus] = useState('idle');
  const [reloadKey, setReloadKey] = useState(0);
  const pendingDeletes = useRef(new Map()); // id -> timer, for deletes that can still be undone

  useEffect(() => {
    const pending = pendingDeletes.current;
    if (!user) {
      setWorkouts([]);
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;
    setStatus('loading');
    supabase
      .from('workout_exercises')
      .select(`id, date, name, exercise_id, workout_sets (${SET_COLUMNS})`)
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error fetching workouts:', error);
          setStatus('error');
          return;
        }
        setWorkouts((data || []).map((row) => normalizeWorkout(row, row.workout_sets)));
        setStatus('ready');
      });

    return () => {
      cancelled = true;
      pending.forEach(clearTimeout); // unfinished deletes are dropped; the entries reappear on next load
      pending.clear();
    };
  }, [user, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // workoutData: { name, exerciseId, date, sets: [{ weight, reps }] }. Resolves true on success.
  const addWorkout = useCallback(
    async (workoutData) => {
      if (!user) return false;
      const name = (workoutData.name || '').trim();
      const date = workoutData.date || formatLocalDate(new Date());
      const sets = workoutData.sets || [];
      if (!name || sets.length === 0) return false;

      try {
        // Preferred: one atomic database call (see supabase/add_workout_function.sql).
        const { data: saved, error: rpcError } = await supabase.rpc('add_workout_exercise', {
          p_date: date,
          p_name: name,
          p_exercise_id: workoutData.exerciseId || null,
          p_sets: sets.map((s) => ({ weight: s.weight, reps: s.reps })),
        });
        if (!rpcError) {
          setWorkouts((prev) => sortNewestFirst([normalizeWorkout(saved, saved.workout_sets), ...prev]));
          return true;
        }
        if (!isMissingFunction(rpcError)) throw rpcError;

        // Fallback while the function is not installed: two inserts, undoing the first if the second fails.
        const { data: exercise, error: exerciseError } = await supabase
          .from('workout_exercises')
          .insert({ user_id: user.id, date, name, exercise_id: workoutData.exerciseId || null })
          .select('id, date, name, exercise_id')
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
          await supabase.from('workout_exercises').delete().eq('id', exercise.id);
          throw setsError;
        }

        setWorkouts((prev) => sortNewestFirst([normalizeWorkout(exercise, insertedSets), ...prev]));
        return true;
      } catch (error) {
        console.error('Error adding workout:', error);
        toast.show(`Could not save workout: ${error.message}`, { type: 'error' });
        return false;
      }
    },
    [user, toast]
  );

  // Removes the entry right away and deletes it for real after UNDO_MS unless undone.
  const deleteWorkout = useCallback(
    (id) => {
      const target = workouts.find((w) => w.id === id);
      if (!target) return;

      const restore = () => setWorkouts((prev) => sortNewestFirst([target, ...prev]));
      setWorkouts((prev) => prev.filter((w) => w.id !== id));

      const timer = setTimeout(async () => {
        pendingDeletes.current.delete(id);
        // Sets are removed by the foreign key's ON DELETE CASCADE.
        const { error } = await supabase.from('workout_exercises').delete().eq('id', id);
        if (error) {
          console.error('Error deleting workout:', error);
          restore();
          toast.show(`Could not delete ${target.name}: ${error.message}`, { type: 'error' });
        }
      }, UNDO_MS);
      pendingDeletes.current.set(id, timer);

      toast.show(`Deleted ${target.name}`, {
        duration: UNDO_MS,
        action: {
          label: 'Undo',
          onClick: () => {
            clearTimeout(timer);
            pendingDeletes.current.delete(id);
            restore();
          },
        },
      });
    },
    [workouts, toast]
  );

  return { workouts, status, reload, addWorkout, deleteWorkout };
};
