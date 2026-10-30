import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
// Fonts are bundled with the app (no requests to Google Fonts).
import '@fontsource-variable/inter/wght.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import './assets/styles/global.css';
import App from './App';
import ConfigError from './components/ConfigError';
import { ToastProvider } from './components/ToastProvider';
import { isSupabaseConfigured } from './utils/supabaseClient';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ToastProvider>
      <BrowserRouter>
        {isSupabaseConfigured ? <App /> : <ConfigError />}
      </BrowserRouter>
    </ToastProvider>
  </React.StrictMode>
);
