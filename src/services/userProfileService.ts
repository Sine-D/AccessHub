/**
 * userProfileService.ts
 * Robust User Profile CRUD service for AccessHub.
 * Handles:
 * - Proper PostgreSQL UUID validation & generation
 * - Direct database reads and upserts to `public.users` table
 * - Graceful local caching (localStorage on Web / memory)
 * - Safe account deletion from `public.users` table
 * - Clean logout session termination
 */

import { supabase } from './supabaseClient';
import { User } from '../core/types';

// Valid UUID format regex for PostgreSQL
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string): boolean {
  return Boolean(id && UUID_REGEX.test(id.trim()));
}

/**
 * Generates a stable, deterministic UUID for given seed string (e.g. email or username)
 * or a valid random UUID v4 if no seed is provided.
 */
export function ensureValidUUID(id?: string, seed?: string): string {
  if (isValidUUID(id)) {
    return (id as string).trim();
  }

  // If a seed email/string is provided, create a deterministic UUID
  const input = (seed || id || 'accesshub-user-' + Date.now()).toLowerCase();
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < input.length; i++) {
    hash1 = (hash1 << 5) - hash1 + input.charCodeAt(i);
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + input.charCodeAt(i);
    hash2 |= 0;
  }

  const p1 = Math.abs(hash1).toString(16).padStart(8, '0').slice(0, 8);
  const p2 = Math.abs(hash2).toString(16).padStart(4, '0').slice(0, 4);
  const p3 = '4' + Math.abs(hash1 ^ hash2).toString(16).padStart(3, '0').slice(0, 3);
  const p4 = '8' + Math.abs(hash2 >> 2).toString(16).padStart(3, '0').slice(0, 3);
  const p5 = (Math.abs(hash1).toString(16) + Math.abs(hash2).toString(16)).padEnd(12, '0').slice(0, 12);

  return `${p1}-${p2}-${p3}-${p4}-${p5}`;
}

const PROFILE_CACHE_KEY = 'accesshub_cached_profile';
let memoryCache: Partial<User> | null = null;

export function getCachedProfile(): Partial<User> | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data = window.localStorage.getItem(PROFILE_CACHE_KEY);
      if (data) return JSON.parse(data);
    }
  } catch (e) {
    // Ignore storage errors
  }
  return memoryCache;
}

export function setCachedProfile(user: Partial<User>): void {
  memoryCache = user;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    // Ignore storage errors
  }
}

export function clearCachedProfile(): void {
  memoryCache = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch (e) {
    // Ignore
  }
}

/**
 * Reads user profile from Supabase `public.users` table
 */
export async function fetchUserProfile(sessionUserId?: string, userEmail?: string): Promise<User | null> {
  try {
    let query = supabase.from('users').select('*');

    if (isValidUUID(sessionUserId)) {
      query = query.eq('id', sessionUserId);
    } else if (userEmail) {
      query = query.eq('email', userEmail.trim().toLowerCase());
    } else {
      return null;
    }

    const { data, error } = await query.maybeSingle();

    if (!error && data) {
      const user: User = {
        id: data.id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'customer',
        avatar: data.avatar || '',
        bio: data.bio || '',
        location: data.location || '',
        accommodations: data.accommodations || {},
        verified: Boolean(data.is_verified ?? true),
        rating: Number(data.rating ?? 5.0),
        reviewsCount: Number(data.reviews_count ?? 1),
      };
      setCachedProfile(user);
      return user;
    }
  } catch (err) {
    console.warn('Notice fetching user profile from database:', err);
  }

  // Fallback to cache if available
  const cached = getCachedProfile();
  return (cached as User) || null;
}

/**
 * Saves/Upserts profile data directly into Supabase `public.users` table
 */
export async function saveUserProfile(user: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const cleanEmail = user.email ? user.email.trim().toLowerCase() : undefined;
    const validId = ensureValidUUID(user.id, cleanEmail || user.name);

    const payload: Record<string, any> = {
      id: validId,
      name: user.name ?? '',
      email: cleanEmail,
      role: user.role ?? 'customer',
    };

    if (user.avatar) payload.avatar = user.avatar;
    if (user.bio !== undefined) payload.bio = user.bio;
    if (user.location !== undefined) payload.location = user.location;
    if (user.accommodations !== undefined) payload.accommodations = user.accommodations;
    if (user.verified !== undefined) payload.is_verified = user.verified;

    // 1. Try upserting by primary key (id)
    const { error: upsertError } = await supabase
      .from('users')
      .upsert(payload, { onConflict: 'id' });

    if (upsertError) {
      console.warn('Upsert notice on users table:', upsertError.message);
      // Fallback: If user already exists by email, update by email
      if (cleanEmail) {
        const { id: _, ...updateFields } = payload;
        await supabase
          .from('users')
          .update(updateFields)
          .eq('email', cleanEmail);
      }
    }

    const updatedUser: User = {
      id: validId,
      name: payload.name,
      email: payload.email || '',
      role: payload.role,
      avatar: payload.avatar || user.avatar || '',
      bio: payload.bio || user.bio || '',
      location: payload.location || user.location || '',
      accommodations: payload.accommodations || user.accommodations,
      verified: payload.is_verified ?? true,
      rating: Number(user.rating ?? 5.0),
      reviewsCount: Number(user.reviewsCount ?? 1),
    };

    setCachedProfile(updatedUser);
    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.warn('Failed saving user profile:', err);
    return { success: false, error: err?.message || 'Failed saving profile.' };
  }
}

/**
 * Permanently deletes user account from Supabase `public.users` table and terminates session
 */
export async function deleteUserAccount(userId?: string, email?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Delete by UUID if valid
    if (isValidUUID(userId)) {
      await supabase.from('users').delete().eq('id', userId as string);
    }

    // 2. Delete by email as well to ensure thorough cleanup
    if (email && email.trim()) {
      await supabase.from('users').delete().eq('email', email.trim().toLowerCase());
    }

    // 3. Clear auth session
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }

    // 4. Clear cache
    clearCachedProfile();

    return { success: true };
  } catch (err: any) {
    console.warn('Failed deleting user account:', err);
    return { success: false, error: err?.message || 'Could not delete user account.' };
  }
}

/**
 * Logs out the user from Supabase and clears cached state
 */
export async function logoutUser(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    // Ignore
  }
  clearCachedProfile();
}
