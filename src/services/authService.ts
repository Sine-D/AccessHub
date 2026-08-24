/**
 * authService.ts
 * Centralised Supabase Auth service for AccessHub.
 * Handles Email/Password Sign-Up and Google OAuth (Web + Expo Go).
 */

import { Platform } from 'react-native';
import { supabase } from './supabaseClient';
import { RegistrationFormData } from '../features/auth/store/useAccessibilityStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

// ─── Email / Password Sign-Up ─────────────────────────────────────────────────

/**
 * Creates a new Supabase Auth user with email + password,
 * then inserts an extended record into `public.users`.
 */
export async function signUpWithEmail(formData: RegistrationFormData): Promise<AuthResult> {
  try {
    // 1. Create the auth user
    const { data, error: signUpError } = await (supabase.auth as any).signUp({
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
        },
      },
    });

    if (signUpError) {
      return { success: false, error: signUpError.message };
    }

    const userId = data?.user?.id;
    if (!userId) {
      return { success: false, error: 'Account creation failed. Please try again.' };
    }

    // 2. Insert record into public.users
    const userResult = await upsertUser(userId, formData);
    if (!userResult.success) {
      // Non-fatal: user table insert failed but auth user exists
      console.warn('User table insert warning:', userResult.error);
    }

    return { success: true, userId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'An unexpected error occurred.' };
  }
}

// ─── Google OAuth ─────────────────────────────────────────────────────────────

/**
 * Initiates Google OAuth sign-in.
 * - Web: Opens Google consent page via browser redirect.
 * - Expo Go / React Native: Opens in-app browser via expo-web-browser.
 */
export async function signInWithGoogle(): Promise<AuthResult> {
  try {
    if (Platform.OS === 'web') {
      // ── Web (Vite/browser) ────────────────────────────────────────────────
      const { error } = await (supabase.auth as any).signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      });

      if (error) return { success: false, error: error.message };
      return { success: true }; // Page will redirect — no further action needed

    } else {
      // ── Expo Go / React Native ────────────────────────────────────────────
      const { makeRedirectUri } = await import('expo-auth-session');
      const { openAuthSessionAsync } = await import('expo-web-browser');

      const redirectUri = makeRedirectUri({ scheme: 'accesshub' });

      // Get the OAuth URL from Supabase (without auto-redirecting)
      const { data, error } = await (supabase.auth as any).signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      });

      if (error) return { success: false, error: error.message };
      if (!data?.url) return { success: false, error: 'Could not get Google OAuth URL.' };

      // Open in-app browser
      const result = await openAuthSessionAsync(data.url, redirectUri);

      if (result.type !== 'success') {
        return { success: false, error: 'Google sign-in was cancelled or failed.' };
      }

      // Extract code or tokens from the OAuth redirect URL
      const normalizedUrl = result.url.replace('#', '?');
      const urlObj = new URL(normalizedUrl);
      const code = urlObj.searchParams.get('code');
      const accessToken = urlObj.searchParams.get('access_token');
      const refreshToken = urlObj.searchParams.get('refresh_token');

      if (code) {
        // Exchange PKCE code for a session
        const { error: exchangeError } = await (supabase.auth as any).exchangeCodeForSession(code);
        if (exchangeError) return { success: false, error: exchangeError.message };
      } else if (accessToken && refreshToken) {
        // Implicit grant fallback
        const { error: setSessionError } = await (supabase.auth as any).setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (setSessionError) return { success: false, error: setSessionError.message };
      } else {
        return { success: false, error: 'No authorization code or session returned from Google.' };
      }

      return { success: true };
    }
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Google authentication failed. Please try again.',
    };
  }
}

// ─── User Upsert ────────────────────────────────────────────────────────────
 
/**
 * Inserts or updates the user's record in `public.users`.
 * Call this after successful auth sign-up or Google OAuth.
 */
export async function upsertUser(
  userId: string,
  formData: Partial<RegistrationFormData> & { highContrast?: boolean; fontScale?: number; audioGuidance?: boolean }
): Promise<AuthResult> {
  try {
    const { error } = await supabase.from('users').upsert(
      {
        id: userId,
        email: formData.email,
        name: formData.fullName ?? '',
        role: formData.role ?? 'buyer',
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.warn('User table upsert notice:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, userId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'User update failed.' };
  }
}

/** Backwards-compatibility alias for upsertUser */
export const upsertUserProfile = upsertUser;

// ─── Session Helpers ──────────────────────────────────────────────────────────

/** Returns the current Supabase session, or null if not signed in. */
export async function getCurrentSession() {
  const { data } = await (supabase.auth as any).getSession();
  return data?.session ?? null;
}

/** Returns the current authenticated user, or null. */
export async function getCurrentUser() {
  const { data } = await (supabase.auth as any).getUser();
  return data?.user ?? null;
}
