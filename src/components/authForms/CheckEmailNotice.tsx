import React from 'react';
import { FaEnvelopeOpenText } from 'react-icons/fa';
import type { SentKind } from '../../hooks/useAuthFlow';

interface CheckEmailNoticeProps {
  kind: SentKind; // 'confirm' after signing up, 'reset' after asking for a password reset
  email: string;
  loading: boolean;
  error: string;
  info: string;
  onResend: () => void;
  onBack: () => void;
}

// Shown once an email has been sent: "check your inbox".
const CheckEmailNotice = ({ kind, email, loading, error, info, onResend, onBack }: CheckEmailNoticeProps) => (
  <div className="auth-sent">
    <div className="auth-sent-icon" aria-hidden="true"><FaEnvelopeOpenText /></div>
    <h2 className="auth-form-title">Check your email</h2>
    <p className="auth-subtext">
      {kind === 'confirm' ? 'We sent a confirmation link to ' : 'If an account exists for '}
      <strong>{email.trim()}</strong>
      {kind === 'confirm' ? '. Click it to activate your account, then log in.' : ', a reset link is on its way.'}
    </p>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {info && <p className="auth-feedback-message" role="status">{info}</p>}
    {kind === 'confirm' && (
      <button type="button" className="link-button auth-center-link" onClick={onResend} disabled={loading}>
        Did not get it? Resend
      </button>
    )}
    <button type="button" className="auth-submit-button" onClick={onBack}>
      Back to log in
    </button>
  </div>
);

export default CheckEmailNotice;
