import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import '../assets/styles/Auth.css';

// Shown instead of the app when the Supabase environment variables are missing.
const ConfigError = () => (
  <div className="auth-page-wrapper">
    <div className="auth-container card">
      <div className="auth-header">
        <div className="auth-logo-icon-container" aria-hidden="true">
          <FaExclamationTriangle />
        </div>
        <h1 className="auth-main-title">Setup needed</h1>
      </div>
      <p className="auth-subtext">
        The app cannot find its Supabase settings. Create a <code>.env</code> file in the project root
        (copy <code>.env.example</code>) with:
      </p>
      <pre className="config-snippet">
        {'VITE_SUPABASE_URL=...\nVITE_SUPABASE_ANON_KEY=...'}
      </pre>
      <p className="auth-subtext">
        Then restart the dev server. On Vercel, add the same two variables under Settings &gt;
        Environment Variables and redeploy.
      </p>
    </div>
  </div>
);

export default ConfigError;
