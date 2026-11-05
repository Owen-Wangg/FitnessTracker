import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../components/ToastProvider';
import { formatLocalDate } from '../utils/workoutMetrics';
import { SET_COLUMNS, normalizeWorkout, sortNewestFirst } from '../utils/workoutData';
import type { SetRow, UserRef, Workout, WorkoutDraft, WorkoutRow, WorkoutSet } from '../types';

export const UNDO_MS = 6000;

// PostgREST reports an uninstalled function as PGRST202 (or says it could not find it).
const isMissingFunction = (error: { code?: string; message?: string } | null): boolean =>
  error?.code === 'PGRST202' || /could not find the function/i.test(error?.message || '');

// The signed-in user's workout entries (newest first) and the actions on them.
//   status: 'idle' (no user) | 'loading' | 'ready' | 'error'
export type WorkoutsStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseWorkoutsResult {
  workouts: Workout[];
  status: WorkoutsStatus;
  reload: () => void;
  addWorkout: (workoutData: WorkoutDraft) => Promise<boolean>;
  updateWorkout: (id: string, workoutData: WorkoutDraft) => Promise<boolean>;
  deleteWorkout: (id: string) => void;
}

// Supabase and PostgREST errors are plain objects with a message; this reads it without assuming an Error.
const messageOf = (error: unknown): string => (error as { message: string }).message;

export const useWorkouts = (user: UserRef | null | undefined): UseWorkoutsResult => {
  const toast = useToast();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [status, setStatus] = useState<WorkoutsStatus>('idle');
  const [reloadKey, setReloadKey] = useState(0);
  const pendingDeletes = useRef(new Map<string, ReturnType<typeof setTimeout>>()); // id -> timer, for deletes that can still be undone

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
        setWorkouts(((data || []) as WorkoutRow[]).map((row) => normalizeWorkout(row, row.workout_sets)));
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
    async (workoutData: WorkoutDraft) => {
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
          const savedRow = saved as WorkoutRow;
          setWorkouts((prev) => sortNewestFirst([normalizeWorkout(savedRow, savedRow.workout_sets), ...prev]));
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

        setWorkouts((prev) =>
          sortNewestFirst([normalizeWorkout(exercise as WorkoutRow, insertedSets as SetRow[]), ...prev])
        );
        return true;
      } catch (error) {
        console.error('Error adding workout:', error);
        toast.show(`Could not save workout: ${messageOf(error)}`, { type: 'error' });
        return false;
      }
    },
    [user, toast]
  );

  // Saves edits to an existing entry; its sets are replaced by workoutData.sets.
  // workoutData: { name, exerciseId, date, sets: [{ weight, reps, set_type? }] }. Resolves true on success.
  const updateWorkout = useCallback(
    async (id: string, workoutData: WorkoutDraft) => {
      const original = workouts.find((w) => w.id === id);
      if (!user || !original) return false;
      const name = (workoutData.name || '').trim();
      const date = workoutData.date || original.date;
      const sets = workoutData.sets || [];
      if (!name || sets.length === 0) return false;
      const exerciseId = workoutData.exerciseId || null;
      const setPayload: Pick<WorkoutSet, 'weight' | 'reps' | 'set_type'>[] = sets.map((s) => ({
        weight: s.weight,
        reps: s.reps,
        ...(s.set_type ? { set_type: s.set_type } : {}),
      }));

      const replaceInState = (row: WorkoutRow, rowSets?: SetRow[] | null) =>
        setWorkouts((prev) => sortNewestFirst(prev.map((w) => (w.id === id ? normalizeWorkout(row, rowSets) : w))));

      try {
        // Preferred: one atomic database call (see supabase/update_workout_function.sql).
        const { data: saved, error: rpcError } = await supabase.rpc('update_workout_exercise', {
          p_id: id,
          p_date: date,
          p_name: name,
          p_exercise_id: exerciseId,
          p_sets: setPayload,
        });
        if (!rpcError) {
          const savedRow = saved as WorkoutRow;
          replaceInState(savedRow, savedRow.workout_sets);
          toast.show('Changes saved', { type: 'success', duration: 2500 });
          return true;
        }
        if (!isMissingFunction(rpcError)) throw rpcError;

        // Fallback while the function is not installed: update, then swap the sets, putting the
        // old values back if anything fails part-way.
        const putBack = async () => {
          try {
            await supabase
              .from('workout_exercises')
              .update({ date: original.date, name: original.name, exercise_id: original.exerciseId })
              .eq('id', id);
            const { count } = await supabase
              .from('workout_sets')
              .select('id', { count: 'exact', head: true })
              .eq('workout_exercise_id', id);
            if (!count) {
              await supabase.from('workout_sets').insert(
                original.sets.map((s) => ({
                  workout_exercise_id: id,
                  user_id: user.id,
                  set_number: s.set_number,
                  weight: s.weight,
                  reps: s.reps,
                  set_type: s.set_type || 'normal',
                }))
              );
            }
          } catch (restoreError) {
            console.error('Could not restore the previous values:', restoreError);
          }
        };

        const { data: exercise, error: updateError } = await supabase
          .from('workout_exercises')
          .update({ date, name, exercise_id: exerciseId })
          .eq('id', id)
          .select('id, date, name, exercise_id')
          .single();
        if (updateError) throw updateError;

        const { error: deleteError } = await supabase.from('workout_sets').delete().eq('workout_exercise_id', id);
        if (deleteError) {
          await putBack();
          throw deleteError;
        }

        const { data: insertedSets, error: setsError } = await supabase
          .from('workout_sets')
          .insert(
            setPayload.map((s, i) => ({
              workout_exercise_id: id,
              user_id: user.id,
              set_number: i + 1,
              weight: s.weight,
              reps: s.reps,
              set_type: s.set_type || 'normal',
            }))
          )
          .select(SET_COLUMNS);
        if (setsError) {
          await putBack();
          throw setsError;
        }

        replaceInState(exercise as WorkoutRow, insertedSets as SetRow[]);
        toast.show('Changes saved', { type: 'success', duration: 2500 });
        return true;
      } catch (error) {
        console.error('Error updating workout:', error);
        toast.show(`Could not save changes: ${messageOf(error)}`, { type: 'error' });
        return false;
      }
    },
    [user, workouts, toast]
  );

  // Removes the entry right away and deletes it for real after UNDO_MS unless undone.
  const deleteWorkout = useCallback(
    (id: string) => {
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

  return { workouts, status, reload, addWorkout, updateWorkout, deleteWorkout };
};
