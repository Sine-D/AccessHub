import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'process.env.EXPO_PUBLIC_SUPABASE_URL': JSON.stringify(
        env.EXPO_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || ''
      ),
      'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(
        env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || ''
      ),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(
        env.VITE_SUPABASE_URL || env.EXPO_PUBLIC_SUPABASE_URL || ''
      ),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(
        env.VITE_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
      ),
    },
    resolve: {
      extensions: ['.web.js', '.web.jsx', '.web.ts', '.web.tsx', '.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': path.resolve(__dirname, './src'),
        'react-native-safe-area-context': path.resolve(
          __dirname,
          './src/utils/SafeAreaContext.web.tsx'
        ),
        'expo-auth-session': path.resolve(
          __dirname,
          './src/utils/ExpoAuthSession.web.ts'
        ),
        'expo-web-browser': path.resolve(
          __dirname,
          './src/utils/ExpoWebBrowser.web.ts'
        ),
        'react-native': 'react-native-web',
      },
    },
    server: {
      port: 3000,
      host: true,
    },
  };
});
