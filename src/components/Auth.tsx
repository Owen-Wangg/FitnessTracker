// src/components/Auth.tsx
import React from 'react';
import { FaDumbbell } from 'react-icons/fa';
import { useAuthFlow } from '../hooks/useAuthFlow';
import LogInSignUpForm from './authForms/LogInSignUpForm';
import ForgotPasswordForm from './authForms/ForgotPasswordForm';
import CheckEmailNotice from './authForms/CheckEmailNotice';
import NewPasswordForm from './authForms/NewPasswordForm';
import '../assets/styles/Auth.css';

interface AuthProps {
  recoveryMode?: boolean;
  onPasswordUpdated?: () => void;
}

// The signed-out screen: the app's header above whichever step of the login flow is showing.
// recoveryMode: user arrived from a password-reset email and must choose a new password.
// What each step does lives in useAuthFlow; how each looks lives in ./authForms.
const Auth = ({ recoveryMode = false, onPasswordUpdated }: AuthProps) => {
  const flow = useAuthFlow({ recoveryMode, onPasswordUpdated });
  const { view, email, password, loading, error, info } = flow;

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

        {(view === 'login' || view === 'signup') && (
          <LogInSignUpForm
            mode={view}
            email={email}
            onEmailChange={flow.setEmail}
            password={password}
            onPasswordChange={flow.setPassword}
            loading={loading}
            error={error}
            info={info}
            onSubmit={view === 'login' ? flow.logIn : flow.signUp}
            onSwitchMode={flow.goTo}
            onForgotPassword={() => flow.goTo('forgot')}
            onGoogle={flow.continueWithGoogle}
            onResendConfirmation={flow.resendConfirmation}
          />
        )}

        {view === 'forgot' && (
          <ForgotPasswordForm
            email={email}
            onEmailChange={flow.setEmail}
            loading={loading}
            error={error}
            onSubmit={flow.sendResetLink}
            onBack={() => flow.goTo('login')}
          />
        )}

        {view === 'sent' && (
          <CheckEmailNotice
            kind={flow.sentKind}
            email={email}
            loading={loading}
            error={error}
            info={info}
            onResend={flow.resendConfirmation}
            onBack={() => flow.goTo('login')}
          />
        )}

        {view === 'recovery' && (
          <NewPasswordForm
            password={password}
            onPasswordChange={flow.setPassword}
            loading={loading}
            error={error}
            onSubmit={flow.chooseNewPassword}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
