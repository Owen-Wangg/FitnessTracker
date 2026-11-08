import React from 'react';

interface EmailFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const EmailField = ({ value, onChange }: EmailFieldProps) => (
  <div className="form-group">
    <label htmlFor="email">Email</label>
    <input
      id="email"
      type="email"
      inputMode="email"
      autoComplete="email"
      autoCapitalize="none"
      spellCheck={false}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="you@example.com"
      required
    />
  </div>
);

export default EmailField;
