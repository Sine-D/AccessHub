
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn((url: string, key: string) => ({
    url,
    key,
    auth: {},
    from: jest.fn(),
  })),
}));

describe('Supabase Client Configuration and Sanitization', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    delete process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const getCreateClientMock = () => {
    return require('@supabase/supabase-js').createClient;
  };

  describe('Positive Cases', () => {
    it('should initialize successfully with EXPO_PUBLIC environment variables', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'expo_anon_key_123';

      const createClientMock = getCreateClientMock();
      const { supabase, isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(true);
      expect(createClientMock).toHaveBeenCalledWith(
        'https://myproject.supabase.co',
        'expo_anon_key_123'
      );
      expect(supabase).toBeDefined();
    });

    it('should initialize successfully with VITE environment variables when EXPO_PUBLIC is absent', () => {
      process.env.VITE_SUPABASE_URL = 'https://viteproject.supabase.co';
      process.env.VITE_SUPABASE_ANON_KEY = 'vite_anon_key_456';

      const createClientMock = getCreateClientMock();
      const { supabase, isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(true);
      expect(createClientMock).toHaveBeenCalledWith(
        'https://viteproject.supabase.co',
        'vite_anon_key_456'
      );
      expect(supabase).toBeDefined();
    });

    it('should re-export client and configured flag from services/supabaseClient', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://myproject.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'expo_anon_key_123';

      const core = require('../src/core/supabase');
      const service = require('../src/services/supabaseClient');

      expect(service.supabase).toBe(core.supabase);
      expect(service.isSupabaseConfigured).toBe(core.isSupabaseConfigured);
    });
  });

  describe('Negative & Fallback Cases', () => {
    it('should set isSupabaseConfigured to false and log a warning when env vars are missing', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
      const createClientMock = getCreateClientMock();

      const { supabase, isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(false);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Supabase environment variables are missing')
      );
      expect(createClientMock).toHaveBeenCalledWith(
        'https://placeholder.supabase.co',
        'supabase-anon-key-not-configured'
      );
      expect(supabase).toBeDefined();
      warnSpy.mockRestore();
    });

    it('should set isSupabaseConfigured to false if only URL is provided without key', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://onlyurl.supabase.co';

      const { isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(false);
      warnSpy.mockRestore();
    });

    it('should set isSupabaseConfigured to false if only key is provided without URL', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'only_key_123';

      const { isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(false);
      warnSpy.mockRestore();
    });
  });

  describe('Edge Cases (Sanitization)', () => {
    it('should strip single and multiple trailing slashes from the URL', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co///';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'key_123';

      const createClientMock = getCreateClientMock();
      const { isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(true);
      expect(createClientMock).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'key_123'
      );
    });

    it('should strip /rest/v1 from URL if user accidentally included it', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co/rest/v1';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'key_123';

      const createClientMock = getCreateClientMock();
      const { isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(true);
      expect(createClientMock).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'key_123'
      );
    });

    it('should strip /rest/v1/ with trailing slash', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://project.supabase.co/rest/v1/';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'key_123';

      const createClientMock = getCreateClientMock();
      const { isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(true);
      expect(createClientMock).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'key_123'
      );
    });

    it('should trim surrounding whitespace from URL and anon key', () => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = '   https://project.supabase.co   ';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = '   anon_key_trimmed   ';

      const createClientMock = getCreateClientMock();
      const { isSupabaseConfigured } = require('../src/core/supabase');

      expect(isSupabaseConfigured).toBe(true);
      expect(createClientMock).toHaveBeenCalledWith(
        'https://project.supabase.co',
        'anon_key_trimmed'
      );
    });
  });
});
