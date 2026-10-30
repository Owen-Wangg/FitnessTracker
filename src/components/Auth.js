// src/components/Auth.js
import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FaDumbbell, FaEye, FaEyeSlash, FaEnvelopeOpenText } from 'react-icons/fa';
import '../assets/styles/Auth.css';

const MIN_PASSWORD_LENGTH = 8;

const friendlyError = (error) => {
  const message = error?.message || 'Something went wrong. Please try again.';
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(message)) return 'Please confirm your email first. Check your inbox for the link.';
  if (/rate limit|too many/i.test(message)) return 'Too many attempts. Please wait a minute and try again.';
  return message;
};

const PasswordField = ({ id, label, value, onChange, autoComplete, hint, children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="form-group">
      <div className="label-row">
        <label htmlFor={id}>{label}</label>
        {children}
      </div>
      <div className="password-field">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          minLength={MIN_PASSWORD_LENGTH}
          required
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
};

// recoveryMode: user arrived from a password-reset email and must choose a new password.
const Auth = ({ recoveryMode = false, onPasswordUpdated }) => {
  // 'login' | 'signup' | 'forgot' | 'sent' | 'recovery'
  const [view, setView] = useState(recoveryMode ? 'recovery' : 'login');
  const [sentKind, setSentKind] = useState('confirm'); // 'confirm' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const goTo = (nextView) => {
    setView(nextView);
    setError('');
    setInfo('');
    setPassword('');
  };

  const run = async (action) => {
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

  const handleLogin = (e) => {
    e.preventDefault();
    run(async () => {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) throw authError;
    });
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    run(async () => {
      if (password.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      }
      const { data, error: authError } = await supabase.auth.signUp({
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

  const handleForgot = (e) => {
    e.preventDefault();
    run(async () => {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (authError) throw authError;
      // Same message whether or not the account exists, so emails cannot be probed.
      setSentKind('reset');
      setView('sent');
    });
  };

  const handleRecovery = (e) => {
    e.preventDefault();
    run(async () => {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      onPasswordUpdated?.();
    });
  };

  const handleResend = () =>
    run(async () => {
      const { error: authError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      setInfo('Email sent again. It can take a minute to arrive.');
    });

  const isLogin = view === 'login';
  const isSignUp = view === 'signup';

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container card">
        <div className="auth-header">
          <div className="auth-logo-icon-container" aria-hidden="true">
            <FaDumbbell />
          </div>
          <h1 className="auth-main-title">Fitness Tracker</h1>
          <p className="auth-tagline">Log your lifts. Watch yourself get stronger.</p>
        </div>

        {(isLogin || isSignUp) && (
          <>
            <div className="auth-tabs" role="tablist" aria-label="Log in or sign up">
              <button
                type="button"
                role="tab"
                aria-selected={isLogin}
                className={`auth-tab ${isLogin ? 'active' : ''}`}
                onClick={() => goTo('login')}
                disabled={loading}
              >
                Log In
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={isSignUp}
                className={`auth-tab ${isSignUp ? 'active' : ''}`}
                onClick={() => goTo('signup')}
                disabled={loading}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={isLogin ? handleLogin : handleSignUp}>
              <h2 className="auth-form-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>

              {error && <p className="auth-error" role="alert">{error}</p>}
              {info && <p className="auth-feedback-message" role="status">{info}</p>}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <PasswordField
                id="password"
                label="Password"
                value={password}
                onChange={setPassword}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                hint={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
              >
                {isLogin && (
                  <button type="button" className="link-button" onClick={() => goTo('forgot')}>
                    Forgot password?
                  </button>
                )}
              </PasswordField>

              <button type="submit" className="auth-submit-button" disabled={loading}>
                {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
              </button>

              {isLogin && /confirm your email/i.test(error) && (
                <button type="button" className="link-button auth-center-link" onClick={handleResend} disabled={loading}>
                  Resend confirmation email
                </button>
              )}
            </form>
          </>
        )}

        {view === 'forgot' && (
          <form onSubmit={handleForgot}>
            <h2 className="auth-form-title">Reset your password</h2>
            <p className="auth-subtext">Enter your email and we will send you a link to choose a new password.</p>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <button type="submit" className="auth-submit-button" disabled={loading}>
              {loading ? 'Please wait...' : 'Send reset link'}
            </button>
            <button type="button" className="link-button auth-center-link" onClick={() => goTo('login')}>
              Back to log in
            </button>
          </form>
        )}

        {view === 'sent' && (
          <div className="auth-sent">
            <div className="auth-sent-icon" aria-hidden="true"><FaEnvelopeOpenText /></div>
            <h2 className="auth-form-title">Check your email</h2>
            <p className="auth-subtext">
              {sentKind === 'confirm'
                ? 'We sent a confirmation link to '
                : 'If an account exists for '}
              <strong>{email.trim()}</strong>
              {sentKind === 'confirm'
                ? '. Click it to activate your account, then log in.'
                : ', a reset link is on its way.'}
            </p>
            {error && <p className="auth-error" role="alert">{error}</p>}
            {info && <p className="auth-feedback-message" role="status">{info}</p>}
            {sentKind === 'confirm' && (
              <button type="button" className="link-button auth-center-link" onClick={handleResend} disabled={loading}>
                Did not get it? Resend
              </button>
            )}
            <button type="button" className="auth-submit-button" onClick={() => goTo('login')}>
              Back to log in
            </button>
          </div>
        )}

        {view === 'recovery' && (
          <form onSubmit={handleRecovery}>
            <h2 className="auth-form-title">Choose a new password</h2>
            {error && <p className="auth-error" role="alert">{error}</p>}
            <PasswordField
              id="new-password"
              label="New password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
            />
            <button type="submit" className="auth-submit-button" disabled={loading}>
              {loading ? 'Please wait...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
