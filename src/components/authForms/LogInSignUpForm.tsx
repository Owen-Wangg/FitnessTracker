import React from 'react';
import { FaGoogle } from 'react-icons/fa';
import { MIN_PASSWORD_LENGTH } from '../../utils/authMessages';
import EmailField from './EmailField';
import PasswordField from './PasswordField';

interface LogInSignUpFormProps {
  mode: 'login' | 'signup';
  email: string;
  onEmailChange: (value: string) => void;
  password: string;
  onPasswordChange: (value: string) => void;
  loading: boolean;
  error: string;
  info: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onForgotPassword: () => void;
  onGoogle: () => void;
  onResendConfirmation: () => void;
}

// The two tabs (Log In / Sign Up) with Google sign-in and the email form beneath them.
const LogInSignUpForm = ({
  mode,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  loading,
  error,
  info,
  onSubmit,
  onSwitchMode,
  onForgotPassword,
  onGoogle,
  onResendConfirmation,
}: LogInSignUpFormProps) => {
  const isLogin = mode === 'login';
  const isSignUp = !isLogin;

  return (
    <>
      <div className="auth-tabs" role="tablist" aria-label="Log in or sign up">
        <button
          type="button"
          role="tab"
          aria-selected={isLogin}
          className={`auth-tab ${isLogin ? 'active' : ''}`}
          onClick={() => onSwitchMode('login')}
          disabled={loading}
        >
          Log In
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isSignUp}
          className={`auth-tab ${isSignUp ? 'active' : ''}`}
          onClick={() => onSwitchMode('signup')}
          disabled={loading}
        >
          Sign Up
        </button>
      </div>

      <h2 className="auth-form-title">{isLogin ? 'Welcome back' : 'Create your account'}</h2>

      <button type="button" className="google-button" onClick={onGoogle} disabled={loading}>
        <FaGoogle aria-hidden="true" /> Continue with Google
      </button>
      <div className="auth-divider"><span>or use email</span></div>

      <form onSubmit={onSubmit}>
        {error && <p className="auth-error" role="alert">{error}</p>}
        {info && <p className="auth-feedback-message" role="status">{info}</p>}

        <EmailField value={email} onChange={onEmailChange} />

        <PasswordField
          id="password"
          label="Password"
          value={password}
          onChange={onPasswordChange}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          hint={isSignUp ? `At least ${MIN_PASSWORD_LENGTH} characters.` : undefined}
        >
          {isLogin && (
            <button type="button" className="link-button" onClick={onForgotPassword}>
              Forgot password?
            </button>
          )}
        </PasswordField>

        <button type="submit" className="auth-submit-button" disabled={loading}>
          {loading ? 'Please wait...' : isLogin ? 'Log In' : 'Create Account'}
        </button>

        {isLogin && /confirm your email/i.test(error) && (
          <button type="button" className="link-button auth-center-link" onClick={onResendConfirmation} disabled={loading}>
            Resend confirmation email
          </button>
        )}
      </form>
    </>
  );
};

export default LogInSignUpForm;
