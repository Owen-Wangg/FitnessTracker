import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env = import.meta.env;
const supabaseUrl = env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY;

// index.js checks this and shows <ConfigError /> instead of the app when it is false.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Typed as always present: index.tsx only renders the app when isSupabaseConfigured is true, so nothing
// reaches for the client otherwise (at runtime it is null when the env vars are missing).
export const supabase = (isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null) as SupabaseClient;
