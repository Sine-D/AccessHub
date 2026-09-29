export const COMMUNITY_VERIFICATION_VERSION = 1 as const;

export interface CommunityHubVerificationPayload {
  badge: string | null;
  lastVerifiedAt: string | null;
  placeId: string;
  rating: number | null;
  reviewCount: number;
  status: 'verified' | 'unverified' | 'unavailable';
  version: typeof COMMUNITY_VERIFICATION_VERSION;
}

export function isCommunityHubVerificationPayload(
  value: unknown,
  expectedPlaceId?: string,
): value is CommunityHubVerificationPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const item = value as Partial<CommunityHubVerificationPayload>;
  return (
    item.version === COMMUNITY_VERIFICATION_VERSION &&
    typeof item.placeId === 'string' &&
    (!expectedPlaceId || item.placeId === expectedPlaceId) &&
    ['verified', 'unverified', 'unavailable'].includes(String(item.status)) &&
    (item.rating === null ||
      (typeof item.rating === 'number' && Number.isFinite(item.rating) && item.rating >= 0 && item.rating <= 5)) &&
    typeof item.reviewCount === 'number' &&
    Number.isInteger(item.reviewCount) &&
    item.reviewCount >= 0 &&
    (item.badge === null || typeof item.badge === 'string') &&
    (item.lastVerifiedAt === null ||
      (typeof item.lastVerifiedAt === 'string' && !Number.isNaN(Date.parse(item.lastVerifiedAt))))
  );
}

