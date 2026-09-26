export type BadgeCategory = 'compliance' | 'wheelchair' | 'visual_audio' | 'wcag_aaa';

export type BadgeStatus = 'awarded' | 'ineligible' | 'pending_review';

export interface CriteriaRatings {
  wheelchairRamp: number;
  brailleMenu: number;
  audioSignal: number;
  accessibleRestroom: number;
}

export interface AccessibilityScoreDetails {
  wheelchairRamp: number;
  brailleMenu: number;
  audioSignal: number;
  accessibleRestroom: number;
  criteriaAverage: number;
  overallScore: number; // out of 5.0
  percentage: number;   // 0 to 100
}

export interface BadgeVerificationInput {
  entityId: string;
  entityType: 'place' | 'vendor';
  entityName: string;
  ratings?: CriteriaRatings;
  ratingCount?: number;
  isVerified?: boolean;
}

export interface BadgeVerificationResult {
  isEligible: boolean;
  score: number;
  ratingCount: number;
  isVerified: boolean;
  badgeType: string;
  reason: string;
  missingRequirements: string[];
}

export interface AccessibilityBadgeRecord {
  id: string;
  entityId: string;
  entityType: 'place' | 'vendor';
  entityName: string;
  badgeType: string;
  score: number;
  ratingCount: number;
  status: BadgeStatus;
  isVerified: boolean;
  awardedAt?: string;
  awardedBy?: string;
  reason?: string;
}

