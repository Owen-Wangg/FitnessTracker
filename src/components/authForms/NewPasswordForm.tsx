import React from 'react';
import { MIN_PASSWORD_LENGTH } from '../../utils/authMessages';
import PasswordField from './PasswordField';

interface NewPasswordFormProps {
  password: string;
  onPasswordChange: (value: string) => void;
  loading: boolean;
  error: string;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

// Shown after following a password-reset email.
const NewPasswordForm = ({ password, onPasswordChange, loading, error, onSubmit }: NewPasswordFormProps) => (
  <form onSubmit={onSubmit}>
    <h2 className="auth-form-title">Choose a new password</h2>
    {error && <p className="auth-error" role="alert">{error}</p>}
    <PasswordField
      id="new-password"
      label="New password"
      value={password}
      onChange={onPasswordChange}
      autoComplete="new-password"
      hint={`At least ${MIN_PASSWORD_LENGTH} characters.`}
    />
    <button type="submit" className="auth-submit-button" disabled={loading}>
      {loading ? 'Please wait...' : 'Update password'}
    </button>
  </form>
);

export default NewPasswordForm;
