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
    'Supabase configuration is missing. Add Expo or Vite Supabase environment variables.',
  );
}

/*
 * These fallback values prevent a blank screen during local UI
 * development. Database and authentication requests require the
 * real Supabase URL and anonymous key.
 */
const supabaseUrl =
  configuredUrl ?? 'https://placeholder.supabase.co';

const supabaseAnonKey =
  configuredAnonKey ?? 'supabase-anon-key-not-configured';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);