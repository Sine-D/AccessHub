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

  // ────────────────────────────────────────────────────────────────────────────
  // 5. LocalStorage Caching & Storage Exception Handling
  // ────────────────────────────────────────────────────────────────────────────
  describe('LocalStorage Cache Handling', () => {
    const originalWindow = global.window;

    afterEach(() => {
      global.window = originalWindow;
    });

    it('reads cached profile from window.localStorage when available', () => {
      const mockStorage: Record<string, string> = {
        accesshub_cached_profile: JSON.stringify({ id: 'loc-id', name: 'LocalStorage User' }),
      };

      (global as any).window = {
        localStorage: {
          getItem: jest.fn((k: string) => mockStorage[k] || null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
        },
      };

      const cached = getCachedProfile();
      expect(cached?.name).toBe('LocalStorage User');
    });

    it('writes profile to window.localStorage when setCachedProfile is called', () => {
      const mockSetItem = jest.fn();
      (global as any).window = {
        localStorage: {
          getItem: jest.fn(),
          setItem: mockSetItem,
          removeItem: jest.fn(),
        },
      };

      setCachedProfile({ id: 'ls-write', name: 'Saved LS' });
      expect(mockSetItem).toHaveBeenCalledWith(
        'accesshub_cached_profile',
        expect.stringContaining('Saved LS')
      );
    });

    it('removes profile from window.localStorage when clearCachedProfile is called', () => {
      const mockRemoveItem = jest.fn();
      (global as any).window = {
        localStorage: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          removeItem: mockRemoveItem,
        },
      };

      clearCachedProfile();
      expect(mockRemoveItem).toHaveBeenCalledWith('accesshub_cached_profile');
    });

    it('handles localStorage read exceptions gracefully', () => {
      (global as any).window = {
        localStorage: {
          getItem: jest.fn(() => {
            throw new Error('Storage access denied');
          }),
        },
      };

      expect(() => getCachedProfile()).not.toThrow();
    });

    it('handles localStorage write exceptions gracefully', () => {
      (global as any).window = {
        localStorage: {
          setItem: jest.fn(() => {
            throw new Error('QuotaExceededError');
          }),
        },
      };

      expect(() => setCachedProfile({ name: 'Quota User' })).not.toThrow();
    });

    it('handles localStorage remove exceptions gracefully', () => {
      (global as any).window = {
        localStorage: {
          removeItem: jest.fn(() => {
            throw new Error('Storage error');
          }),
        },
      };

      expect(() => clearCachedProfile()).not.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6. Database Error & Fallback Pathways
  // ────────────────────────────────────────────────────────────────────────────
  describe('Database Exception & Fallback Coverage', () => {
    it('returns null immediately when fetchUserProfile is called without id and email', async () => {
      const res = await fetchUserProfile(undefined, undefined);
      expect(res).toBeNull();
    });

    it('handles database exception during fetchUserProfile gracefully and falls back to cache', async () => {
      setCachedProfile({ id: 'fallback-cache-id', name: 'Fallback User' });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockRejectedValueOnce(new Error('Network reset')),
          }),
        }),
      });

      const res = await fetchUserProfile('123e4567-e89b-12d3-a456-426614174000', 'test@test.com');
      expect(res?.name).toBe('Fallback User');
    });

    it('handles database exception during saveUserProfile gracefully', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Database server down');
      });

      const res = await saveUserProfile({
        name: 'Offline Save',
        email: 'offline@save.lk',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Database server down');
    });

    it('handles database exception during deleteUserAccount gracefully', async () => {
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('DB connection refused');
      });

      const res = await deleteUserAccount('123e4567-e89b-12d3-a456-426614174000', 'err@test.lk');
      expect(res.success).toBe(false);
      expect(res.error).toBe('DB connection refused');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 7. Parametric UUID Validation Matrix (15+ Tests)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Parametric UUID Validations', () => {
    const validUUIDs = [
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      'fb5e1979-d586-4447-b844-0a373ff2556b',
      '00000000-0000-0000-0000-000000000000',
      'ffffffff-ffff-ffff-ffff-ffffffffffff',
      '12345678-1234-5678-1234-567812345678',
    ];

    validUUIDs.forEach((uuid) => {
      it(`parametric: recognizes valid UUID "${uuid}"`, () => {
        expect(isValidUUID(uuid)).toBe(true);
        expect(ensureValidUUID(uuid)).toBe(uuid);
      });
    });

    const invalidIDs = [
      'user_12345',
      'abc',
      '123e4567-e89b-12d3-a456',
      '123e4567-e89b-12d3-a456-426614174000-extra',
      'not-a-uuid-at-all',
      'null',
      'undefined',
    ];

    invalidIDs.forEach((id) => {
      it(`parametric: rejects non-UUID "${id}" and generates valid UUID`, () => {
        expect(isValidUUID(id)).toBe(false);
        const fixed = ensureValidUUID(id);
        expect(isValidUUID(fixed)).toBe(true);
      });
    });
  });
});

