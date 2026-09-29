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

