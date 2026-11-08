import React, { useState, type ReactNode } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { MIN_PASSWORD_LENGTH } from '../../utils/authMessages';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  hint?: string;
  children?: ReactNode; // shown beside the label, e.g. a "Forgot password?" link
}

// A password input with a show/hide button.
const PasswordField = ({ id, label, value, onChange, autoComplete, hint, children }: PasswordFieldProps) => {
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

export default PasswordField;
