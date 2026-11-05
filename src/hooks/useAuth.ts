import { useCallback, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { useToast } from '../components/ToastProvider';

// Session state from Supabase auth.
//   loading:    true until the first session check finishes
//   recovering: true after following a password-reset email, until clearRecovery()
export interface UseAuthResult {
  session: Session | null;
  user: User | null;
  loading: boolean;
  recovering: boolean;
  clearRecovery: () => void;
  signOut: () => Promise<boolean>;
}

export const useAuth = (): UseAuthResult => {
  const toast = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: current } }) => setSession(current))
      .catch((error) => console.error('Error getting session:', error))
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      setSession(next);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.show(`Could not sign out: ${error.message}`, { type: 'error' });
    return !error;
  }, [toast]);

  const clearRecovery = useCallback(() => setRecovering(false), []);

  return { session, user: session?.user ?? null, loading, recovering, clearRecovery, signOut };
};
