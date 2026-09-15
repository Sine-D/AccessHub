import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey,
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase configuration is missing. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.',
  );
}

const configuredUrl =
  supabaseUrl ?? 'https://placeholder.supabase.co';

const configuredAnonKey =
  supabaseAnonKey ?? 'supabase-anon-key-not-configured';

export const supabase = createClient(
  configuredUrl,
  configuredAnonKey,
);

