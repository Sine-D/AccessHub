
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import bcrypt from 'bcryptjs';
import {
  initiateEmailSignUp,
  verifyEmailOtp,
  resendSignUpOtp,
  signInWithGoogle,
  upsertUser,
  getCurrentSession,
  getCurrentUser,
  signUpWithEmail,
  upsertUserProfile,
} from '../src/services/authService';
import { supabase } from '../src/services/supabaseClient';
import { RegistrationFormData } from '../src/features/auth/store/useAccessibilityStore';

// ─── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('react-native', () => ({
  Platform: {
    OS: 'web',
  },
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'accesshub://auth'),
}));

jest.mock('expo-web-browser', () => ({
  maybeCompleteAuthSession: jest.fn(),
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  genSalt: jest.fn().mockResolvedValue('mock_salt_123'),
  hash: jest.fn().mockResolvedValue('mock_hashed_password'),
}));

jest.mock('../src/services/supabaseClient', () => {
  return {
    supabase: {
      auth: {
        signUp: jest.fn(),
        verifyOtp: jest.fn(),
        resend: jest.fn(),
        signInWithOAuth: jest.fn(),
        exchangeCodeForSession: jest.fn(),
        setSession: jest.fn(),
        getUser: jest.fn(),
        getSession: jest.fn(),
      },
      from: jest.fn(),
    },
    isSupabaseConfigured: true,
  };
});

describe('authService Test Suite', () => {
  const mockFormData: RegistrationFormData = {
    fullName: 'Jane Doe',
    email: 'Jane.Doe@Example.com',
    password: 'Password123!',
    role: 'buyer',
    accommodations: {
      visual: true,
      motor: false,
      hearing: false,
      cognitive: false,
    },
    otpCode: '123456',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Platform as any).OS = 'web';
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. initiateEmailSignUp
  // ────────────────────────────────────────────────────────────────────────────
  describe('initiateEmailSignUp', () => {
    describe('Positive Cases', () => {
      it('should successfully initiate email sign up with normalized email and metadata', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: { user: { id: 'usr_new_1', identities: [{ id: 'ident_1' }] } },
          error: null,
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(supabase.auth.signUp).toHaveBeenCalledWith({
          email: 'jane.doe@example.com',
          password: 'Password123!',
          options: {
            data: {
              full_name: 'Jane Doe',
              role: 'buyer',
            },
          },
        });
        expect(result).toEqual({ success: true, userId: 'usr_new_1' });
      });

      it('should support different roles such as artisan, freelancer, and volunteer', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValue({
          data: { user: { id: 'usr_artisan' } },
          error: null,
        });

        const artisanData = { ...mockFormData, role: 'artisan' as const };
        const result = await initiateEmailSignUp(artisanData);

        expect(supabase.auth.signUp).toHaveBeenCalledWith(
          expect.objectContaining({
            options: {
              data: {
                full_name: 'Jane Doe',
                role: 'artisan',
              },
            },
          })
        );
        expect(result.success).toBe(true);
      });
    });

    describe('Negative Cases', () => {
      it('should return failure when Supabase returns an explicit error message', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: null,
          error: { message: 'Password is too weak' },
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(result).toEqual({ success: false, error: 'Password is too weak' });
      });

      it('should fail when user exists (empty identities) and resend fails with an error', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: { user: { id: 'usr_existing', identities: [] } },
          error: null,
        });
        (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
          error: { message: 'User is banned' },
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(supabase.auth.resend).toHaveBeenCalledWith({
          type: 'signup',
          email: 'jane.doe@example.com',
        });
        expect(result).toEqual({ success: false, error: 'User is banned' });
      });

      it('should provide default error message when resend fails with no error string for existing user', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: { user: { id: 'usr_existing', identities: [] } },
          error: null,
        });
        (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
          error: { message: '' },
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(result).toEqual({
          success: false,
          error: 'This email is already registered. Please check your inbox or click Resend Code.',
        });
      });

      it('should handle signUpError with undefined message property', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: null,
          error: { message: undefined },
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(result).toEqual({ success: false, error: undefined });
      });
    });

    describe('Edge Cases', () => {
      it('should handle rate limit during initial sign up and return rateLimited: true', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: null,
          error: { message: 'Email rate limit exceeded' },
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(result.success).toBe(true);
        expect(result.rateLimited).toBe(true);
        expect(result.error).toContain('A verification code was already dispatched recently');
      });

      it('should handle "rate_limit" with underscore in error message', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: null,
          error: { message: 'over_email_send_rate_limit' },
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(result.success).toBe(true);
        expect(result.rateLimited).toBe(true);
      });

      it('should handle rate limit when resending OTP to an existing user with empty identities', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: { user: { id: 'usr_existing', identities: [] } },
          error: null,
        });
        (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
          error: { message: 'Rate limit: Supabase allows 1 email every 60s.' },
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(result.success).toBe(true);
        expect(result.rateLimited).toBe(true);
        expect(result.error).toContain('every 60s');
      });

      it('should succeed when user exists (empty identities) and resend OTP succeeds', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: { user: { id: 'usr_existing', identities: [] } },
          error: null,
        });
        (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
          error: null,
        });

        const result = await initiateEmailSignUp(mockFormData);

        expect(result).toEqual({ success: true, userId: 'usr_existing' });
      });

      it('should trim surrounding whitespace from email', async () => {
        (supabase.auth.signUp as jest.Mock).mockResolvedValueOnce({
          data: { user: { id: 'usr_trimmed' } },
          error: null,
        });

        const paddedData = { ...mockFormData, email: '   Test.User@Domain.org   ' };
        await initiateEmailSignUp(paddedData);

        expect(supabase.auth.signUp).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test.user@domain.org',
          })
        );
      });
    });

    describe('Error Cases', () => {
      it('should catch exceptions thrown by Supabase client and return failure', async () => {
        (supabase.auth.signUp as jest.Mock).mockRejectedValueOnce(new Error('Network connection timeout'));

        const result = await initiateEmailSignUp(mockFormData);

        expect(result).toEqual({ success: false, error: 'Network connection timeout' });
      });

      it('should handle thrown exception containing rate limit text', async () => {
        (supabase.auth.signUp as jest.Mock).mockRejectedValueOnce(new Error('Hit rate limit'));

        const result = await initiateEmailSignUp(mockFormData);

        expect(result.success).toBe(true);
        expect(result.rateLimited).toBe(true);
      });

      it('should provide default error message if thrown error has no message', async () => {
        (supabase.auth.signUp as jest.Mock).mockRejectedValueOnce({});

        const result = await initiateEmailSignUp(mockFormData);

        expect(result).toEqual({ success: false, error: 'Failed to send verification email.' });
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. verifyEmailOtp
  // ────────────────────────────────────────────────────────────────────────────
  describe('verifyEmailOtp', () => {
    beforeEach(() => {
      const mockUpsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });
    });

    describe('Positive Cases', () => {
      it('should verify OTP successfully with "signup" type and upsert user', async () => {
        (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
          data: { user: { id: 'usr_valid_otp' } },
          error: null,
        });

        const result = await verifyEmailOtp('test@example.com', '654321', mockFormData);

        expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
          email: 'test@example.com',
          token: '654321',
          type: 'signup',
        });
        expect(result).toEqual({ success: true, userId: 'usr_valid_otp' });
        expect(supabase.from).toHaveBeenCalledWith('users');
      });

      it('should extract userId from session.user.id if user.id is not top-level', async () => {
        (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
          data: { session: { user: { id: 'usr_from_session' } } },
          error: null,
        });

        const result = await verifyEmailOtp('test@example.com', '654321', mockFormData);

        expect(result).toEqual({ success: true, userId: 'usr_from_session' });
      });
    });

    describe('Negative Cases', () => {
      it('should return failure when both "signup" and fallback "email" OTP types fail with normal token', async () => {
        (supabase.auth.verifyOtp as jest.Mock)
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'Token is invalid' },
          })
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'Token is invalid for email type' },
          });

        const result = await verifyEmailOtp('test@example.com', '999999', mockFormData);

        expect(supabase.auth.verifyOtp).toHaveBeenCalledTimes(2);
        expect(result).toEqual({ success: false, error: 'Token is invalid' });
      });

      it('should return default "Invalid verification code." if error message is empty', async () => {
        (supabase.auth.verifyOtp as jest.Mock)
          .mockResolvedValueOnce({ data: null, error: { message: '' } })
          .mockResolvedValueOnce({ data: null, error: { message: '' } });

        const result = await verifyEmailOtp('test@example.com', '999999', mockFormData);

        expect(result).toEqual({ success: false, error: 'Invalid verification code.' });
      });
    });

    describe('Edge Cases', () => {
      it('should successfully fallback to type "email" when type "signup" fails', async () => {
        (supabase.auth.verifyOtp as jest.Mock)
          .mockResolvedValueOnce({
            data: null,
            error: { message: 'Signup token not accepted' },
          })
          .mockResolvedValueOnce({
            data: { user: { id: 'usr_fallback_email' } },
            error: null,
          });

        const result = await verifyEmailOtp('test@example.com', '654321', mockFormData);

        expect(supabase.auth.verifyOtp).toHaveBeenNthCalledWith(1, {
          email: 'test@example.com',
          token: '654321',
          type: 'signup',
        });
        expect(supabase.auth.verifyOtp).toHaveBeenNthCalledWith(2, {
          email: 'test@example.com',
          token: '654321',
          type: 'email',
        });
        expect(result).toEqual({ success: true, userId: 'usr_fallback_email' });
      });

      it('should activate dev bypass with test token 123456 when Supabase returns error', async () => {
        (supabase.auth.verifyOtp as jest.Mock)
          .mockResolvedValueOnce({ data: null, error: { message: 'Token invalid' } })
          .mockResolvedValueOnce({ data: null, error: { message: 'Token invalid' } });

        const result = await verifyEmailOtp('test@example.com', '123456', mockFormData);

        expect(result.success).toBe(true);
        expect(result.userId).toMatch(/^usr_/);
        expect(supabase.from).toHaveBeenCalledWith('users');
      });

      it('should activate dev bypass with test token 849201 when Supabase returns error', async () => {
        (supabase.auth.verifyOtp as jest.Mock)
          .mockResolvedValueOnce({ data: null, error: { message: 'Token invalid' } })
          .mockResolvedValueOnce({ data: null, error: { message: 'Token invalid' } });

        const result = await verifyEmailOtp('test@example.com', '849201', mockFormData);

        expect(result.success).toBe(true);
        expect(result.userId).toMatch(/^usr_/);
      });

      it('should handle dev token with surrounding whitespace', async () => {
        (supabase.auth.verifyOtp as jest.Mock)
          .mockResolvedValueOnce({ data: null, error: { message: 'Token invalid' } })
          .mockResolvedValueOnce({ data: null, error: { message: 'Token invalid' } });

        const result = await verifyEmailOtp('test@example.com', '   123456   ', mockFormData);

        expect(result.success).toBe(true);
        expect(result.userId).toMatch(/^usr_/);
      });

      it('should still succeed even if upsertUser logs a warning', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
          data: { user: { id: 'usr_upsert_warn' } },
          error: null,
        });

        // Make users upsert return an error
        (supabase.from as jest.Mock).mockReturnValue({
          upsert: jest.fn().mockResolvedValueOnce({ error: { message: 'Table constraint warning' } }),
        });

        const result = await verifyEmailOtp('test@example.com', '777777', mockFormData);

        expect(result).toEqual({ success: true, userId: 'usr_upsert_warn' });
        expect(warnSpy).toHaveBeenCalled();
        warnSpy.mockRestore();
      });

      it('should return success without upsert if userId is not present in response', async () => {
        (supabase.auth.verifyOtp as jest.Mock).mockResolvedValueOnce({
          data: {},
          error: null,
        });

        const result = await verifyEmailOtp('test@example.com', '777777', mockFormData);

        expect(result).toEqual({ success: true, userId: undefined });
      });
    });

    describe('Error Cases', () => {
      it('should trigger dev bypass in catch block if an exception is thrown with test token 123456', async () => {
        (supabase.auth.verifyOtp as jest.Mock).mockRejectedValueOnce(new Error('Network offline'));

        const result = await verifyEmailOtp('test@example.com', '123456', mockFormData);

        expect(result.success).toBe(true);
        expect(result.userId).toMatch(/^usr_/);
      });

      it('should trigger dev bypass in catch block if an exception is thrown with test token 849201', async () => {
        (supabase.auth.verifyOtp as jest.Mock).mockRejectedValueOnce(new Error('Fatal error'));

        const result = await verifyEmailOtp('test@example.com', '849201', mockFormData);

        expect(result.success).toBe(true);
        expect(result.userId).toMatch(/^usr_/);
      });

      it('should catch exception and return failure message for normal token', async () => {
        (supabase.auth.verifyOtp as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

        const result = await verifyEmailOtp('test@example.com', '999999', mockFormData);

        expect(result).toEqual({ success: false, error: 'Network failure' });
      });

      it('should return fallback message if thrown error has no message for normal token', async () => {
        (supabase.auth.verifyOtp as jest.Mock).mockRejectedValueOnce({});

        const result = await verifyEmailOtp('test@example.com', '999999', mockFormData);

        expect(result).toEqual({ success: false, error: 'Verification failed. Please try again.' });
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. resendSignUpOtp
  // ────────────────────────────────────────────────────────────────────────────
  describe('resendSignUpOtp', () => {
    describe('Positive Cases', () => {
      it('should successfully resend OTP with normalized email', async () => {
        (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({ error: null });

        const result = await resendSignUpOtp('  User@Domain.Com  ');

        expect(supabase.auth.resend).toHaveBeenCalledWith({
          type: 'signup',
          email: 'user@domain.com',
        });
        expect(result).toEqual({ success: true });
      });
    });

    describe('Negative Cases', () => {
      it('should return failure when Supabase resend returns an error', async () => {
        (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
          error: { message: 'Email address not found' },
        });

        const result = await resendSignUpOtp('user@domain.com');

        expect(result).toEqual({ success: false, error: 'Email address not found' });
      });
    });

    describe('Edge Cases', () => {
      it('should return rateLimited: true when error mentions "rate limit"', async () => {
        (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
          error: { message: 'Too many requests, rate limit reached' },
        });

        const result = await resendSignUpOtp('user@domain.com');

        expect(result.success).toBe(false);
        expect(result.rateLimited).toBe(true);
        expect(result.error).toContain('Supabase allows 1 email every 60s');
      });

      it('should handle "rate_limit" underscore pattern', async () => {
        (supabase.auth.resend as jest.Mock).mockResolvedValueOnce({
          error: { message: 'over_rate_limit' },
        });

        const result = await resendSignUpOtp('user@domain.com');

        expect(result.rateLimited).toBe(true);
      });
    });

    describe('Error Cases', () => {
      it('should catch exceptions and return error message', async () => {
        (supabase.auth.resend as jest.Mock).mockRejectedValueOnce(new Error('Connection dropped'));

        const result = await resendSignUpOtp('user@domain.com');

        expect(result).toEqual({ success: false, error: 'Connection dropped' });
      });

      it('should return fallback error message if exception has no message', async () => {
        (supabase.auth.resend as jest.Mock).mockRejectedValueOnce({});

        const result = await resendSignUpOtp('user@domain.com');

        expect(result).toEqual({ success: false, error: 'Could not resend OTP code.' });
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4. signInWithGoogle
  // ────────────────────────────────────────────────────────────────────────────
  describe('signInWithGoogle', () => {
    describe('Web Platform', () => {
      beforeEach(() => {
        (Platform as any).OS = 'web';
      });

      it('should trigger browser redirect OAuth on web when window is defined', async () => {
        (global as any).window = { location: { origin: 'http://localhost:3000' } };
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({ error: null });

        const result = await signInWithGoogle();

        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: 'http://localhost:3000',
          },
        });
        expect(result).toEqual({ success: true });
        delete (global as any).window;
      });

      it('should handle web OAuth when window is undefined', async () => {
        delete (global as any).window;
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({ error: null });

        const result = await signInWithGoogle();

        expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
          provider: 'google',
          options: {
            redirectTo: undefined,
          },
        });
        expect(result).toEqual({ success: true });
      });

      it('should return failure when web OAuth fails', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          error: { message: 'OAuth configuration disabled' },
        });

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: false, error: 'OAuth configuration disabled' });
      });

      it('should catch exceptions on web', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockRejectedValueOnce(new Error('Popup blocked'));

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: false, error: 'Popup blocked' });
      });
    });

    describe('Mobile Platform (Expo / React Native)', () => {
      beforeEach(() => {
        (Platform as any).OS = 'android';
        const mockUpsert = jest.fn().mockResolvedValue({ error: null });
        (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsert });
      });

      it('should execute PKCE authorization flow successfully on mobile', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://auth.supabase.co/oauth/authorize' },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
          type: 'success',
          url: 'accesshub://auth?code=mock_pkce_code_123',
        });
        (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValueOnce({
          error: null,
        });
        (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
          data: {
            user: {
              id: 'usr_google_1',
              email: 'googleuser@example.com',
              user_metadata: { full_name: 'Google User', role: 'freelancer' },
            },
          },
        });

        const result = await signInWithGoogle();

        expect(AuthSession.makeRedirectUri).toHaveBeenCalledWith({ scheme: 'accesshub' });
        expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
          'https://auth.supabase.co/oauth/authorize',
          'accesshub://auth'
        );
        expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('mock_pkce_code_123');
        expect(supabase.from).toHaveBeenCalledWith('users');
        expect(result).toEqual({ success: true, userId: 'usr_google_1' });
      });

      it('should execute implicit grant flow when access_token and refresh_token are in redirect URL hash', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://auth.supabase.co/oauth/authorize' },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
          type: 'success',
          url: 'accesshub://auth#access_token=mock_access_token&refresh_token=mock_refresh_token',
        });
        (supabase.auth.setSession as jest.Mock).mockResolvedValueOnce({ error: null });
        (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
          data: {
            user: {
              id: 'usr_google_implicit',
              email: 'implicit@example.com',
              user_metadata: { name: 'Implicit User' },
            },
          },
        });

        const result = await signInWithGoogle();

        expect(supabase.auth.setSession).toHaveBeenCalledWith({
          access_token: 'mock_access_token',
          refresh_token: 'mock_refresh_token',
        });
        expect(result).toEqual({ success: true, userId: 'usr_google_implicit' });
      });

      it('should return failure when signInWithOAuth returns an error on mobile', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: null,
          error: { message: 'Provider not enabled' },
        });

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: false, error: 'Provider not enabled' });
      });

      it('should return failure if data.url is missing from signInWithOAuth response', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: null,
          error: null,
        });

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: false, error: 'Could not get Google OAuth URL.' });
      });

      it('should return failure if user cancels or dismisses in-app browser', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://auth.supabase.co/oauth/authorize' },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
          type: 'cancel',
        });

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: false, error: 'Google sign-in was cancelled or failed.' });
      });

      it('should return failure when redirect URL has neither code nor tokens', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://auth.supabase.co/oauth/authorize' },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
          type: 'success',
          url: 'accesshub://auth?state=xyz',
        });

        const result = await signInWithGoogle();

        expect(result).toEqual({
          success: false,
          error: 'No authorization code or session returned from Google.',
        });
      });

      it('should return failure if exchangeCodeForSession returns an error', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://auth.supabase.co/oauth/authorize' },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
          type: 'success',
          url: 'accesshub://auth?code=invalid_code',
        });
        (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValueOnce({
          error: { message: 'Code has expired' },
        });

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: false, error: 'Code has expired' });
      });

      it('should return failure if setSession returns an error', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://auth.supabase.co/oauth/authorize' },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
          type: 'success',
          url: 'accesshub://auth?access_token=bad_at&refresh_token=bad_rt',
        });
        (supabase.auth.setSession as jest.Mock).mockResolvedValueOnce({
          error: { message: 'Invalid token payload' },
        });

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: false, error: 'Invalid token payload' });
      });

      it('should handle edge case where getUser returns null user after OAuth', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://auth.supabase.co/oauth/authorize' },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
          type: 'success',
          url: 'accesshub://auth?code=mock_code',
        });
        (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValueOnce({ error: null });
        (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({ data: { user: null } });

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: true, userId: undefined });
      });

      it('should default fullName to empty string when user_metadata has neither full_name nor name', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
          data: { url: 'https://auth.supabase.co/oauth/authorize' },
          error: null,
        });
        (WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
          type: 'success',
          url: 'accesshub://auth?code=mock_code',
        });
        (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValueOnce({ error: null });
        (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
          data: {
            user: {
              id: 'usr_no_name',
              email: 'noname@example.com',
              user_metadata: {},
            },
          },
        });

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: true, userId: 'usr_no_name' });
        expect(supabase.from).toHaveBeenCalledWith('users');
      });

      it('should catch unexpected exceptions during mobile OAuth flow', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockRejectedValueOnce(new Error('Device offline'));

        const result = await signInWithGoogle();

        expect(result).toEqual({ success: false, error: 'Device offline' });
      });

      it('should return default fallback message when thrown error has no message', async () => {
        (supabase.auth.signInWithOAuth as jest.Mock).mockRejectedValueOnce({});

        const result = await signInWithGoogle();

        expect(result).toEqual({
          success: false,
          error: 'Google authentication failed. Please try again.',
        });
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5. upsertUser
  // ────────────────────────────────────────────────────────────────────────────
  describe('upsertUser', () => {
    let mockUpsertFn: jest.Mock;

    beforeEach(() => {
      mockUpsertFn = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({ upsert: mockUpsertFn });
    });

    describe('Positive Cases', () => {
      it('should hash plain password and upsert full user profile', async () => {
        const result = await upsertUser('usr_100', mockFormData);

        expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
        expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 'mock_salt_123');
        expect(supabase.from).toHaveBeenCalledWith('users');
        expect(mockUpsertFn).toHaveBeenCalledWith(
          {
            id: 'usr_100',
            email: 'jane.doe@example.com',
            name: 'Jane Doe',
            role: 'buyer',
            password: 'mock_hashed_password',
            accommodations: {
              visual: true,
              motor: false,
              hearing: false,
              cognitive: false,
            },
          },
          { onConflict: 'id' }
        );
        expect(result).toEqual({ success: true, userId: 'usr_100' });
      });

      it('should use pre-computed passwordHash directly without invoking bcrypt', async () => {
        const result = await upsertUser('usr_prehashed', {
          email: 'pre@example.com',
          fullName: 'Prehashed User',
          passwordHash: 'already_hashed_secret',
        });

        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(mockUpsertFn).toHaveBeenCalledWith(
          expect.objectContaining({
            password: 'already_hashed_secret',
          }),
          { onConflict: 'id' }
        );
        expect(result).toEqual({ success: true, userId: 'usr_prehashed' });
      });

      it('should allow upserting user without password (e.g. OAuth user)', async () => {
        const result = await upsertUser('usr_oauth', {
          email: 'oauth@example.com',
          fullName: 'OAuth User',
          role: 'freelancer',
        });

        expect(mockUpsertFn).toHaveBeenCalledWith(
          {
            id: 'usr_oauth',
            email: 'oauth@example.com',
            name: 'OAuth User',
            role: 'freelancer',
          },
          { onConflict: 'id' }
        );
        expect(result).toEqual({ success: true, userId: 'usr_oauth' });
      });
    });

    describe('Negative Cases', () => {
      it('should return failure when Supabase database upsert returns an error', async () => {
        const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
        mockUpsertFn.mockResolvedValueOnce({
          error: { message: 'Unique constraint violation on email' },
        });

        const result = await upsertUser('usr_fail', mockFormData);

        expect(result).toEqual({
          success: false,
          error: 'Unique constraint violation on email',
        });
        expect(warnSpy).toHaveBeenCalledWith(
          'User table upsert notice:',
          'Unique constraint violation on email'
        );
        warnSpy.mockRestore();
      });
    });

    describe('Edge Cases', () => {
      it('should handle undefined email by passing undefined', async () => {
        await upsertUser('usr_no_email', {
          fullName: 'No Email User',
        });

        expect(mockUpsertFn).toHaveBeenCalledWith(
          expect.objectContaining({
            email: undefined,
            name: 'No Email User',
            role: 'buyer',
          }),
          { onConflict: 'id' }
        );
      });

      it('should default missing fullName to empty string and missing role to "buyer"', async () => {
        await upsertUser('usr_defaults', {});

        expect(mockUpsertFn).toHaveBeenCalledWith(
          expect.objectContaining({
            name: '',
            role: 'buyer',
          }),
          { onConflict: 'id' }
        );
      });

      it('should omit accommodations if not provided in formData', async () => {
        await upsertUser('usr_no_acc', {
          fullName: 'Test',
        });

        const payload = mockUpsertFn.mock.calls[0][0];
        expect(payload).not.toHaveProperty('accommodations');
      });
    });

    describe('Error Cases', () => {
      it('should catch bcrypt exceptions and return failure', async () => {
        (bcrypt.genSalt as jest.Mock).mockRejectedValueOnce(new Error('Entropy source unavailable'));

        const result = await upsertUser('usr_err', { password: 'secretpassword' });

        expect(result).toEqual({ success: false, error: 'Entropy source unavailable' });
      });

      it('should return fallback message if thrown error has no message', async () => {
        (bcrypt.genSalt as jest.Mock).mockRejectedValueOnce({});

        const result = await upsertUser('usr_err', { password: 'secretpassword' });

        expect(result).toEqual({ success: false, error: 'User update failed.' });
      });
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6. Session Helpers and Aliases
  // ────────────────────────────────────────────────────────────────────────────
  describe('Session Helpers & Aliases', () => {
    describe('getCurrentSession', () => {
      it('should return the current session when available', async () => {
        const mockSession = { access_token: 'token_abc', user: { id: 'usr_1' } };
        (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
          data: { session: mockSession },
        });

        const session = await getCurrentSession();

        expect(session).toEqual(mockSession);
      });

      it('should return null when session is not available', async () => {
        (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
          data: { session: null },
        });

        const session = await getCurrentSession();

        expect(session).toBeNull();
      });

      it('should return null when data is undefined', async () => {
        (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({});

        const session = await getCurrentSession();

        expect(session).toBeNull();
      });
    });

    describe('getCurrentUser', () => {
      it('should return the current user when available', async () => {
        const mockUser = { id: 'usr_current', email: 'user@test.com' };
        (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
          data: { user: mockUser },
        });

        const user = await getCurrentUser();

        expect(user).toEqual(mockUser);
      });

      it('should return null when user is not signed in', async () => {
        (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
          data: { user: null },
        });

        const user = await getCurrentUser();

        expect(user).toBeNull();
      });

      it('should return null when data is undefined', async () => {
        (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({});

        const user = await getCurrentUser();

        expect(user).toBeNull();
      });
    });

    describe('Aliases', () => {
      it('signUpWithEmail should point to initiateEmailSignUp', () => {
        expect(signUpWithEmail).toBe(initiateEmailSignUp);
      });

      it('upsertUserProfile should point to upsertUser', () => {
        expect(upsertUserProfile).toBe(upsertUser);
      });
    });
  });
});
