// src/components/Auth.js
import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { FaDumbbell } from 'react-icons/fa'; // <<<--- IMPORT THE ICON
import '../assets/styles/Auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      let response;
      if (isSignUp) {
        response = await supabase.auth.signUp({ email, password });
        if (response.error) throw response.error;
        if (response.data.user && !response.data.user.email_confirmed_at) {
          setMessage('Sign up successful! Please check your email to confirm your account.');
        } else if (response.data.user) {
          setMessage('Sign up successful and email confirmed! You will be redirected shortly.');
        } else {
          setMessage('Sign up process initiated. Please check your email.');
        }
      } else {
        response = await supabase.auth.signInWithPassword({ email, password });
        if (response.error) throw response.error;
        // setMessage('Logged in successfully! Redirecting...'); // App.js handles redirect
      }
    } catch (error) {
      setMessage(error.error_description || error.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container card">
        <div className="auth-header">
          <div className="auth-logo-icon-container" aria-hidden="true"> {/* Changed class name */}
            <FaDumbbell /> {/* <<<--- USE THE ICON COMPONENT HERE */}
          </div>
          <h1 className="auth-main-title">Fitness Tracker</h1>
        </div>

        <h2>{isSignUp ? 'Create Account' : 'Log In'}</h2>
        
        {message && <p className="auth-feedback-message">{message}</p>}

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength="6"
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="auth-submit-button" disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
          </button>
        </form>
        <button
          className="toggle-auth-mode"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage('');
          }}
          disabled={loading}
        >
          {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
};

export default Auth;