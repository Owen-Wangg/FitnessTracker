import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../components/ToastProvider';
import { normalizeBodyWeight, sortOldestFirst } from '../utils/workoutData';
import { UNDO_MS } from './useWorkouts';

// The signed-in user's body weight entries, oldest first: [{ id, date, weight }].
export const useBodyWeights = (user) => {
  const toast = useToast();
  const [bodyWeights, setBodyWeights] = useState([]);
  const pendingDeletes = useRef(new Map());

  useEffect(() => {
    const pending = pendingDeletes.current;
    if (!user) {
      setBodyWeights([]);
      return undefined;
    }

    let cancelled = false;
    supabase
      .from('body_weights')
      .select('id, date, weight')
      .eq('user_id', user.id)
      .order('date', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('Error fetching body weights:', error);
          toast.show(`Could not load body weight: ${error.message}`, { type: 'error' });
          return;
        }
        setBodyWeights((data || []).map(normalizeBodyWeight));
      });

    return () => {
      cancelled = true;
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, [user, toast]);

  // Logging the same date again replaces that day's entry. Resolves true on success.
  const logBodyWeight = useCallback(
    async ({ date, weight }) => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('body_weights')
        .upsert({ user_id: user.id, date, weight }, { onConflict: 'user_id,date' })
        .select('id, date, weight')
        .single();

      if (error) {
        console.error('Error logging body weight:', error);
        toast.show(`Could not save weight: ${error.message}`, { type: 'error' });
        return false;
      }
      const entry = normalizeBodyWeight(data);
      setBodyWeights((prev) => sortOldestFirst([...prev.filter((b) => b.date !== entry.date), entry]));
      return true;
    },
    [user, toast]
  );

  const deleteBodyWeight = useCallback(
    (id) => {
      const target = bodyWeights.find((b) => b.id === id);
      if (!target) return;

      const restore = () => setBodyWeights((prev) => sortOldestFirst([...prev, target]));
      setBodyWeights((prev) => prev.filter((b) => b.id !== id));

      const timer = setTimeout(async () => {
        pendingDeletes.current.delete(id);
        const { error } = await supabase.from('body_weights').delete().eq('id', id);
        if (error) {
          console.error('Error deleting body weight:', error);
          restore();
          toast.show(`Could not delete entry: ${error.message}`, { type: 'error' });
        }
      }, UNDO_MS);
      pendingDeletes.current.set(id, timer);

      toast.show('Deleted weight entry', {
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
    [bodyWeights, toast]
  );

  return { bodyWeights, logBodyWeight, deleteBodyWeight };
};
