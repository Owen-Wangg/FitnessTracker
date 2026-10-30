import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './assets/styles/global.css';
import App from './App';
import ConfigError from './components/ConfigError';
import { ToastProvider } from './components/ToastProvider';
import { isSupabaseConfigured } from './utils/supabaseClient';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        {isSupabaseConfigured ? <App /> : <ConfigError />}
      </BrowserRouter>
    </ToastProvider>
  </React.StrictMode>
);
