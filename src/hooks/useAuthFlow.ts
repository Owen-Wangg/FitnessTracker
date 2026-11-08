import { useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../utils/supabaseClient';
import { MIN_PASSWORD_LENGTH, friendlyError } from '../utils/authMessages';

export type AuthView = 'login' | 'signup' | 'forgot' | 'sent' | 'recovery';
export type SentKind = 'confirm' | 'reset';

// The auth client, or a readable error (shown by run()) if the app was started without Supabase settings.
const authClient = () => {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase.auth;
};

interface Options {
  recoveryMode?: boolean; // the user arrived from a password-reset email and must choose a new password
  onPasswordUpdated?: () => void;
}

// Everything the login screens do: which screen is showing, the typed values, the request in flight,
// and the handler behind each button. The components that draw the screens stay free of Supabase.
export const useAuthFlow = ({ recoveryMode = false, onPasswordUpdated }: Options = {}) => {
  const [view, setView] = useState<AuthView>(recoveryMode ? 'recovery' : 'login');
  const [sentKind, setSentKind] = useState<SentKind>('confirm');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  // Change screen, clearing messages and the typed password (the email is kept).
  const goTo = (nextView: AuthView) => {
    setView(nextView);
    setError('');
    setInfo('');
    setPassword('');
  };

  // Runs a request with the loading state on, and shows a friendly message if it throws.
  const run = async (action: () => Promise<void>) => {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await action();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const logIn = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(async () => {
      const { error: authError } = await authClient().signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
    });
  };

  const signUp = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(async () => {
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      }
      const { data, error: authError } = await authClient().signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;

      // Supabase returns a user with no identities when the email is already registered.
      if (data.user && data.user.identities?.length === 0) {
        throw new Error('An account with this email already exists. Try logging in instead.');
      }
      // With email confirmation off there is already a session and App takes over.
      if (!data.session) {
        setSentKind('confirm');
        setView('sent');
      }
    });
  };

  // Redirects to Google, then back to this origin with a session.
  const continueWithGoogle = () =>
    run(async () => {
      const { error: authError } = await authClient().signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (authError) throw authError;
    });

  const sendResetLink = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(async () => {
      const { error: authError } = await authClient().resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (authError) throw authError;
      // Same message whether or not the account exists, so emails cannot be probed.
      setSentKind('reset');
      setView('sent');
    });
  };

  const chooseNewPassword = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    run(async () => {
      const { error: authError } = await authClient().updateUser({ password });
      if (authError) throw authError;
      onPasswordUpdated?.();
    });
  };

  const resendConfirmation = () =>
    run(async () => {
      const { error: authError } = await authClient().resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      setInfo('Email sent again. It can take a minute to arrive.');
    });

  return {
    view,
    sentKind,
    email,
    setEmail,
    password,
    setPassword,
    loading,
    error,
    info,
    goTo,
    logIn,
    signUp,
    continueWithGoogle,
    sendResetLink,
    chooseNewPassword,
    resendConfirmation,
  };
};
