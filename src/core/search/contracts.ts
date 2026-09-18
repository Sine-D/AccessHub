export const FEATURES = ['wheelchair_ramp','step_free','accessible_parking','accessible_restroom','braille','sign_language','tactile_paving','elevator','high_contrast'] as const;
export type Feature = typeof FEATURES[number];
export const INTENTS = ['places','products','jobs','unknown'] as const;
export interface SearchQuery {
  intent: typeof INTENTS[number];
  keywords: string;
  category: string | null;
  location: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  features: Feature[];
  needsClarification: boolean;
  clarification: string | null;
}
export interface SearchResponse { query: SearchQuery; source: 'openai' | 'keyword'; }
export const emptyQuery = (): SearchQuery => ({
  intent: 'unknown', keywords: '', category: null, location: null, minPrice: null,
  maxPrice: null, features: [], needsClarification: true,
  clarification: 'Please specify products, places or jobs and what you need.',
});
export function validateInput(value: unknown): {text: string; locale: string} {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid query.');
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !['text','locale'].includes(k))) throw new Error('Only text and locale are accepted.');
  if (typeof v.text !== 'string' || !v.text.trim() || v.text.length > 500) throw new Error('Enter 1–500 characters.');
  if (v.locale !== undefined && !['en-LK','en-US','si-LK','ta-LK'].includes(String(v.locale))) throw new Error('Unsupported locale.');
  return {text: v.text.normalize('NFKC').trim(), locale: String(v.locale ?? 'en-LK')};
}
export function isSearchQuery(value: unknown): value is SearchQuery {
  if (!value || typeof value !== 'object') return false;
  const q = value as SearchQuery;
  const price = (n: unknown) => n === null || (typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100000000);
  return INTENTS.includes(q.intent) && typeof q.keywords === 'string' && q.keywords.length <= 500 &&
    [q.category,q.location,q.clarification].every(x => x === null || (typeof x === 'string' && x.length <= 500)) &&
    price(q.minPrice) && price(q.maxPrice) && (q.minPrice === null || q.maxPrice === null || q.minPrice <= q.maxPrice) &&
    Array.isArray(q.features) && q.features.length <= FEATURES.length && q.features.every(f => FEATURES.includes(f)) &&
    typeof q.needsClarification === 'boolean';
}

