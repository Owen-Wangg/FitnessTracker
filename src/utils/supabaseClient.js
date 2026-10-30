import { createClient } from '@supabase/supabase-js';

const env = import.meta.env;
const supabaseUrl = env.VITE_SUPABASE_URL || env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.REACT_APP_SUPABASE_ANON_KEY;

// index.js checks this and shows <ConfigError /> instead of the app when it is false.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
