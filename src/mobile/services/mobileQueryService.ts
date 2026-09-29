import { isSearchQuery, validateInput } from '../../core/search/contracts';
import type { SearchResponse } from '../../core/search/contracts';
import { parseKeywords } from '../../core/search/parser';
import { isSupabaseConfigured, supabase } from '../../core/supabase';

const getSearchApiBase = () =>
  process.env.EXPO_PUBLIC_SEARCH_API_URL?.trim().replace(/\/$/, '');

/**
 * Mobile-safe version of the Sprint 3 query interpreter.
 *
 * The Vite service uses import.meta.env, which Metro cannot bundle. This
 * adapter uses Expo public environment variables and keeps the same secure
 * server contract. When the optional server is unavailable, the tested local
 * multilingual keyword interpreter keeps search usable at no cost.
 */
export async function interpretMobileQuery(
  text: string,
  locale: string,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  const input = validateInput({ text, locale });
  const apiBase = getSearchApiBase();

  if (apiBase) {
    const controller = new AbortController();
    const abort = () => controller.abort();
    signal?.addEventListener('abort', abort, { once: true });
    if (signal?.aborted) controller.abort();
    const timeout = setTimeout(abort, 12_000);

    try {
      const token = isSupabaseConfigured
        ? (await supabase.auth.getSession()).data.session?.access_token
        : undefined;
      const response = await fetch(`${apiBase}/api/interpret`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error('The AI search service is unavailable.');
      const body = (await response.json()) as Partial<SearchResponse>;
      if (!isSearchQuery(body.query) || !['keyword', 'openai'].includes(String(body.source))) {
        throw new Error('The AI search service returned an invalid response.');
      }
      return body as SearchResponse;
    } catch (error) {
      if (signal?.aborted) throw error;
      // Keep the accessible search usable offline and without a paid AI key.
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
  }

  return {
    query: parseKeywords(input.text, input.locale),
    source: 'keyword',
  };
}
