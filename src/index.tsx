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
import { UnitProvider } from './components/UnitProvider';
import { isSupabaseConfigured } from './utils/supabaseClient';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root element');
const root = ReactDOM.createRoot(container);
root.render(
  <React.StrictMode>
    <ToastProvider>
      <UnitProvider>
        <BrowserRouter>
          {isSupabaseConfigured ? <App /> : <ConfigError />}
        </BrowserRouter>
      </UnitProvider>
    </ToastProvider>
  </React.StrictMode>
);
