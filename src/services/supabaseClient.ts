import { createClient } from '@supabase/supabase-js';

const configuredUrl =
  import.meta.env.VITE_SUPABASE_URL?.trim();

const configuredAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  configuredUrl && configuredAnonKey,
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.',
  );
}

/*
 * The fallback values prevent the whole application from displaying
 * a blank screen during local UI development. Supabase requests will
 * not work until real environment values are provided.
 */
const supabaseUrl =
  configuredUrl ?? 'https://placeholder.supabase.co';

const supabaseAnonKey =
  configuredAnonKey ?? 'supabase-anon-key-not-configured';

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
);