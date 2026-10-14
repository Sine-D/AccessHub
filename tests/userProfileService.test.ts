/**
 * userProfileService.test.ts
 * Comprehensive Jest tests for userProfileService:
 * - UUID validation & deterministic generation
 * - Profile fetch from DB with fallback
 * - Profile save/upsert to public.users table
 * - Account delete from users table
 * - Logout session and cache clearance
 */

import {
  isValidUUID,
  ensureValidUUID,
  fetchUserProfile,
  saveUserProfile,
  deleteUserAccount,
  logoutUser,
  getCachedProfile,
  setCachedProfile,
  clearCachedProfile,
} from '../src/services/userProfileService';
import { supabase } from '../src/services/supabaseClient';

jest.mock('../src/services/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        signOut: jest.fn().mockResolvedValue({ error: null }),
      },
      from: jest.fn(),
    },
    isSupabaseConfigured: true,
  };
});

describe('userProfileService Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearCachedProfile();
  });

  describe('UUID Utilities', () => {
    it('isValidUUID should correctly validate RFC4122 UUID strings', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('c0a80101-0000-4000-a000-000000000001')).toBe(true);
      expect(isValidUUID('usr_123')).toBe(false);
      expect(isValidUUID('u1')).toBe(false);
      expect(isValidUUID('')).toBe(false);
      expect(isValidUUID(undefined)).toBe(false);
    });

    it('ensureValidUUID should return the original UUID if already valid', () => {
      const valid = '123e4567-e89b-12d3-a456-426614174000';
      expect(ensureValidUUID(valid)).toBe(valid);
    });

    it('ensureValidUUID should generate a valid UUID when given a non-UUID string or seed', () => {
      const generated = ensureValidUUID('usr-kavindi', 'kavindi.p@accesslink.lk');
      expect(isValidUUID(generated)).toBe(true);

      // Deterministic: same seed produces identical UUID
      const generatedAgain = ensureValidUUID('different-id', 'kavindi.p@accesslink.lk');
      expect(generatedAgain).toBe(generated);
    });
  });

  describe('fetchUserProfile', () => {
    it('should query by UUID when sessionUserId is valid', async () => {
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'buyer',
          avatar: 'avatar.png',
          bio: 'Bio text',
          location: 'Colombo',
          is_verified: true,
        },
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: mockSingle,
          }),
        }),
      });

      const user = await fetchUserProfile('123e4567-e89b-12d3-a456-426614174000', 'jane@example.com');

      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(user).not.toBeNull();
      expect(user?.name).toBe('Jane Doe');
      expect(user?.email).toBe('jane@example.com');
    });

    it('should query by email when sessionUserId is not a valid UUID', async () => {
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Kavindi Perera',
          email: 'kavindi.p@accesslink.lk',
          role: 'customer',
        },
        error: null,
      });

      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockSingle });
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({ eq: mockEq }),
      });

      const user = await fetchUserProfile('usr-kavindi', 'kavindi.p@accesslink.lk');

      expect(mockEq).toHaveBeenCalledWith('email', 'kavindi.p@accesslink.lk');
      expect(user?.name).toBe('Kavindi Perera');
    });

    it('should return cached profile when database returns no data', async () => {
      setCachedProfile({ id: 'cached-id', name: 'Cached User', email: 'cached@example.com' });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValueOnce({ data: null, error: null }),
          }),
        }),
      });

      const user = await fetchUserProfile(undefined, 'cached@example.com');

      expect(user?.name).toBe('Cached User');
    });
  });

  describe('saveUserProfile', () => {
    it('should upsert valid payload with UUID into public.users table', async () => {
      const mockUpsert = jest.fn().mockResolvedValueOnce({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });

      const result = await saveUserProfile({
        id: 'u1', // non-uuid, should be converted
        name: 'Kavindi Perera',
        email: 'kavindi.p@accesslink.lk',
        bio: 'Artisan buyer',
        role: 'customer',
      });

      expect(result.success).toBe(true);
      expect(isValidUUID(result.user?.id)).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
          ),
          name: 'Kavindi Perera',
          email: 'kavindi.p@accesslink.lk',
          role: 'customer',
        }),
        { onConflict: 'id' }
      );
    });

    it('should fallback to update by email if upsert returns an error', async () => {
      const mockUpdate = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      });
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockResolvedValueOnce({ error: { message: 'RLS check fail' } }),
        update: mockUpdate,
      });

      const result = await saveUserProfile({
        name: 'Updated Name',
        email: 'user@example.com',
      });

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('deleteUserAccount', () => {
    it('should delete from users table by UUID and email and sign out', async () => {
      const mockDelete = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });
      (supabase.from as jest.Mock).mockReturnValue({ delete: mockDelete });

      const result = await deleteUserAccount(
        '123e4567-e89b-12d3-a456-426614174000',
        'kavindi.p@accesslink.lk'
      );

      expect(result.success).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('logoutUser', () => {
    it('should sign out and clear cached profile', async () => {
      setCachedProfile({ name: 'Active User' });

      await logoutUser();

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(getCachedProfile()).toBeNull();
    });
  });
});
