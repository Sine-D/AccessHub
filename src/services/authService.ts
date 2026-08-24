/**
 * authService.ts
 * Centralised Supabase Auth service for AccessHub.
 * Handles Email/Password Sign-Up and Google OAuth (Web + Expo Go).
 */

import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import bcrypt from 'bcryptjs';
import { supabase } from './supabaseClient';
import { RegistrationFormData } from '../features/auth/store/useAccessibilityStore';

// Required for web & in-app browser redirect handling
WebBrowser.maybeCompleteAuthSession();

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  success: boolean;
  error?: string;
  userId?: string;
}

// ─── Email / Password Sign-Up with OTP Verification ──────────────────────────

/**
 * Initiates Supabase Auth sign-up and sends a real 6-digit confirmation OTP to the user's email.
 */
export async function initiateEmailSignUp(formData: RegistrationFormData): Promise<AuthResult> {
  try {
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
    return { success: true, userId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send verification email.' };
  }
}

/**
 * Verifies the 6-digit OTP code entered by the user.
 * On success, activates the session and inserts user details into `public.users`.
 */
export async function verifyEmailOtp(
  email: string,
  token: string,
  formData: RegistrationFormData
): Promise<AuthResult> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = token.trim();

    // 1. Try 'signup' verification type
    let { data, error } = await (supabase.auth as any).verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: 'signup',
    });

    // 2. Fallback to 'email' type if 'signup' type is not accepted
    if (error) {
      const fallback = await (supabase.auth as any).verifyOtp({
        email: cleanEmail,
        token: cleanToken,
        type: 'email',
      });
      if (!fallback.error) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      return { success: false, error: error.message || 'Invalid verification code.' };
    }

    const userId = data?.user?.id || data?.session?.user?.id;
    if (userId) {
      // 3. Upsert user into public.users table with hashed password
      const userResult = await upsertUser(userId, formData);
      if (!userResult.success) {
        console.warn('User table insert warning:', userResult.error);
      }
    }

    return { success: true, userId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Verification failed. Please try again.' };
  }
}

/**
 * Resends the 6-digit OTP confirmation code to the user's email.
 */
export async function resendSignUpOtp(email: string): Promise<AuthResult> {
  try {
    const { error } = await (supabase.auth as any).resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Could not resend OTP code.' };
  }
}

/** Legacy alias */
export const signUpWithEmail = initiateEmailSignUp;

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
      const redirectUri = AuthSession.makeRedirectUri({ scheme: 'accesshub' });

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
      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

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

      // Fetch authenticated user details and upsert into public.users
      const { data: userData } = await (supabase.auth as any).getUser();
      const user = userData?.user;
      if (user) {
        await upsertUser(user.id, {
          email: user.email,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || '',
          role: user.user_metadata?.role || 'buyer',
        });
      }

      return { success: true, userId: user?.id };
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
 * Hashes password with bcrypt before saving if provided.
 * Call this after successful auth sign-up or Google OAuth.
 */
export async function upsertUser(
  userId: string,
  formData: Partial<RegistrationFormData> & { passwordHash?: string; highContrast?: boolean; fontScale?: number; audioGuidance?: boolean }
): Promise<AuthResult> {
  try {
    let hashedPassword: string | undefined = formData.passwordHash;
    if (formData.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(formData.password, salt);
    }

    const payload: Record<string, any> = {
      id: userId,
      email: formData.email ? formData.email.trim().toLowerCase() : undefined,
      name: formData.fullName ?? '',
      role: formData.role ?? 'buyer',
    };

    if (hashedPassword) {
      payload.password = hashedPassword;
    }

    if (formData.accommodations) {
      payload.accommodations = formData.accommodations;
    }

    const { error } = await supabase.from('users').upsert(
      payload,
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
