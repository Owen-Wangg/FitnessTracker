import React from 'react';
import EmailField from './EmailField';

interface ForgotPasswordFormProps {
  email: string;
  onEmailChange: (value: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
}

// Asks for an email address and sends a link to choose a new password.
const ForgotPasswordForm = ({ email, onEmailChange, loading, error, onSubmit, onBack }: ForgotPasswordFormProps) => (
  <form onSubmit={onSubmit}>
    <h2 className="auth-form-title">Reset your password</h2>
    <p className="auth-subtext">Enter your email and we will send you a link to choose a new password.</p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <EmailField value={email} onChange={onEmailChange} />
    <button type="submit" className="auth-submit-button" disabled={loading}>
      {loading ? 'Please wait...' : 'Send reset link'}
    </button>
    <button type="button" className="link-button auth-center-link" onClick={onBack}>
      Back to log in
    </button>
  </form>
);

export default ForgotPasswordForm;
