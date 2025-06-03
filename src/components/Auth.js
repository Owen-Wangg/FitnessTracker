// src/components/Auth.js
import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import '../assets/styles/Auth.css'; // Create this CSS file for basic styling

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true); // To toggle between Sign Up and Log In

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let response;
      if (isSignUp) {
        response = await supabase.auth.signUp({ email, password });
      } else {
        response = await supabase.auth.signInWithPassword({ email, password });
      }

      if (response.error) throw response.error;
      // User is signed up/logged in. App.js will handle session changes.
      // You might want to redirect or show a success message here.
      alert(isSignUp ? 'Check your email for verification!' : 'Logged in successfully!');

    } catch (error) {
      alert(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container card">
      <h2>{isSignUp ? 'Create Account' : 'Log In'}</h2>
      <form onSubmit={handleAuth}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
        </button>
      </form>
      <button
        className="toggle-auth-mode"
        onClick={() => setIsSignUp(!isSignUp)}
        disabled={loading}
      >
        {isSignUp ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
      </button>
    </div>
  );
};

export default Auth;