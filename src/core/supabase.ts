import { createClient } from '@supabase/supabase-js';

const expoSupabaseUrl =
  typeof process !== 'undefined'
    ? process.env.EXPO_PUBLIC_SUPABASE_URL?.trim()
    : undefined;

const expoSupabaseAnonKey =
  typeof process !== 'undefined'
    ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim()
    : undefined;

const viteSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim();

const viteSupabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const configuredUrl =
  expoSupabaseUrl || viteSupabaseUrl;

const configuredAnonKey =
  expoSupabaseAnonKey || viteSupabaseAnonKey;

export const isSupabaseConfigured = Boolean(
  configuredUrl && configuredAnonKey,
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing. The app will run in local UI mode.',
  );
}

const supabaseUrl =
  configuredUrl ?? 'https://placeholder.supabase.co';

const supabaseAnonKey =
  configuredAnonKey ?? 'supabase-anon-key-not-configured';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);