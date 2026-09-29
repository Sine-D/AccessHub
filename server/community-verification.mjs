import { isCommunityHubVerificationPayload } from '../src/features/map/types/communityVerification.ts';

const REQUEST_TIMEOUT_MS = 6000;

function getCommunityHubBaseUrl() {
  const value = process.env.COMMUNITY_HUB_BASE_URL?.trim();
  if (!value) return null;

  const url = new URL(value);
  const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) {
    throw new Error('Community Hub URL must use HTTPS.');
  }
  return url;
}

export async function getCommunityVerification(placeId, fallback = null, fetcher = fetch) {
  let baseUrl;
  try {
    baseUrl = getCommunityHubBaseUrl();
  } catch {
    return fallback;
  }
  if (!baseUrl) return fallback;

  const url = new URL(
    `/api/places/${encodeURIComponent(placeId)}/verification-summary`,
    baseUrl,
  );
  const headers = { Accept: 'application/json' };
  const apiKey = process.env.COMMUNITY_HUB_API_KEY?.trim();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  try {
    const response = await fetcher(url, {
      headers,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) return fallback;

    const payload = await response.json();
    if (!isCommunityHubVerificationPayload(payload, placeId)) return fallback;

    return {
      status: payload.status,
      rating: payload.rating,
      reviewCount: payload.reviewCount,
      badge: payload.badge,
      lastVerifiedAt: payload.lastVerifiedAt,
    };
  } catch {
    return fallback;
  }
}
