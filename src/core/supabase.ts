import { createClient } from '@supabase/supabase-js';

function sanitizeSupabaseUrl(url?: string): string {
  if (!url) return '';
  return url.trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

const rawUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL;

const supabaseUrl = sanitizeSupabaseUrl(rawUrl);

const supabaseAnonKey = (
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing. The app will run in local UI mode.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'supabase-anon-key-not-configured'
);
