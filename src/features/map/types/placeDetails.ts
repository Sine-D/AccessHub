import type { MapPin } from '../../../core/types/models';

export interface CommunityVerificationSummary {
  badge: string | null;
  lastVerifiedAt: string | null;
  rating: number | null;
  reviewCount: number;
  status: 'verified' | 'unverified' | 'unavailable';
}

export interface PlaceDetails extends MapPin {
  contactPhone: string | null;
  description: string;
  openingHours: string[];
  verification: CommunityVerificationSummary | null;
  website: string | null;
}

export function isCommunityVerificationSummary(
  value: unknown,
): value is CommunityVerificationSummary {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const summary = value as Partial<CommunityVerificationSummary>;
  return (
    ['verified', 'unverified', 'unavailable'].includes(String(summary.status)) &&
    (summary.rating === null ||
      (typeof summary.rating === 'number' &&
        Number.isFinite(summary.rating) &&
        summary.rating >= 0 &&
        summary.rating <= 5)) &&
    typeof summary.reviewCount === 'number' &&
    Number.isInteger(summary.reviewCount) &&
    summary.reviewCount >= 0 &&
    (summary.badge === null || typeof summary.badge === 'string') &&
    (summary.lastVerifiedAt === null ||
      (typeof summary.lastVerifiedAt === 'string' &&
        !Number.isNaN(Date.parse(summary.lastVerifiedAt))))
  );
}
