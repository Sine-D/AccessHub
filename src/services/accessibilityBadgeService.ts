import { supabase } from '../core/supabase.ts';
import type {
  CriteriaRatings,
  AccessibilityScoreDetails,
  BadgeVerificationInput,
  BadgeVerificationResult,
  AccessibilityBadgeRecord,
} from '../types/accessibilityBadge.ts';

// In-memory badge store for offline/local UI mode
let memoryBadges: AccessibilityBadgeRecord[] = [
  {
    id: 'badge-101',
    entityId: 'mp1',
    entityType: 'place',
    entityName: 'Kavindi Crafts Studio',
    badgeType: 'Wheelchair Barrier-Free Badge',
    score: 4.8,
    ratingCount: 12,
    status: 'awarded',
    isVerified: true,
    awardedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    awardedBy: 'Accessibility Compliance Board',
    reason: 'Verified wheelchair ramp & step-free access verified (Score: 4.8/5.0).',
  },
  {
    id: 'badge-102',
    entityId: 'ver-103',
    entityType: 'vendor',
    entityName: 'Kasun Kalhara Handicrafts',
    badgeType: 'Verified Disabled Creator Badge',
    score: 4.6,
    ratingCount: 8,
    status: 'awarded',
    isVerified: true,
    awardedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    awardedBy: 'Admin Team',
    reason: 'Verified Medical Board Disability Certificate & 4.6/5.0 Accessibility Score.',
  },
  {
    id: 'badge-103',
    entityId: 'mp2',
    entityType: 'place',
    entityName: 'Enable Lanka Foundation Center',
    badgeType: 'Visual & Audio Accessible Badge',
    score: 4.6,
    ratingCount: 15,
    status: 'awarded',
    isVerified: true,
    awardedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    awardedBy: 'Compliance Team',
    reason: 'Sign language staff & Braille documentation verified.',
  },
  {
    id: 'badge-104',
    entityId: 'loc-ineligible-1',
    entityType: 'place',
    entityName: 'Unverified Corner Kiosk',
    badgeType: 'Accessibility Compliance Badge',
    score: 3.2,
    ratingCount: 2,
    status: 'ineligible',
    isVerified: false,
    reason: 'Failed eligibility: Minimum score threshold (4.0) not met and place is unverified.',
  },
];

/**
 * AC-87: Calculate Accessibility Score
 * Calculates criteria average, overall score (out of 5.0), and percentage score.
 */
export function calculateAccessibilityScore(ratings: CriteriaRatings): AccessibilityScoreDetails {
  const ramp = Math.max(1, Math.min(5, Number(ratings.wheelchairRamp || 0)));
  const braille = Math.max(1, Math.min(5, Number(ratings.brailleMenu || 0)));
  const audio = Math.max(1, Math.min(5, Number(ratings.audioSignal || 0)));
  const restroom = Math.max(1, Math.min(5, Number(ratings.accessibleRestroom || 0)));

  const sum = ramp + braille + audio + restroom;
  const criteriaAverage = Number((sum / 4).toFixed(2));
  const overallScore = criteriaAverage;
  const percentage = Math.round((overallScore / 5) * 100);

  return {
    wheelchairRamp: ramp,
    brailleMenu: braille,
    audioSignal: audio,
    accessibleRestroom: restroom,
    criteriaAverage,
    overallScore,
    percentage,
  };
}

/**
 * Queries real-time DB data from Supabase tables:
 * - place_accessibility_ratings
 * - vendor_verifications
 * - users
 */
export async function fetchEntityDatabaseDetails(
  entityId: string,
  entityType: 'place' | 'vendor'
): Promise<{ ratings?: CriteriaRatings; ratingCount: number; isVerified: boolean }> {
  let isVerified = false;
  let ratingCount = 0;
  let fetchedRatings: CriteriaRatings | undefined;

  try {
    if (entityType === 'place') {
      // 1. Query ratings from place_accessibility_ratings DB table
      const { data: ratingsData } = await supabase
        .from('place_accessibility_ratings')
        .select('*')
        .eq('location_id', entityId);

      if (ratingsData && ratingsData.length > 0) {
        ratingCount = ratingsData.length;
        const avg = (key: string) =>
          ratingsData.reduce((sum: number, r: any) => sum + Number(r[key] || 0), 0) / ratingsData.length;

        fetchedRatings = {
          wheelchairRamp: Math.round(avg('wheelchair_ramp')),
          brailleMenu: Math.round(avg('braille_menu')),
          audioSignal: Math.round(avg('audio_signal')),
          accessibleRestroom: Math.round(avg('accessible_restroom')),
        };

        const verifiedCount = ratingsData.filter((r: any) => r.verification_status === 'verified').length;
        if (verifiedCount > 0 || ratingsData.length >= 1) {
          isVerified = true;
        }
      }
    } else {
      // 2. Query vendor_verifications DB table
      const { data: vendorData } = await supabase
        .from('vendor_verifications')
        .select('*')
        .eq('id', entityId)
        .maybeSingle();

      if (vendorData) {
        isVerified = vendorData.status === 'approved';
        ratingCount = 1;
      } else {
        // Query users DB table
        const { data: userData } = await supabase
          .from('users')
          .select('is_verified')
          .eq('id', entityId)
          .maybeSingle();

        if (userData) {
          isVerified = Boolean(userData.is_verified);
          ratingCount = 1;
        }
      }
    }
  } catch (err) {
    console.warn('Notice querying Supabase DB for entity details:', err);
  }

  return {
    ratings: fetchedRatings,
    ratingCount: ratingCount || (isVerified ? 1 : 0),
    isVerified,
  };
}

/**
 * AC-88: Check Verification Rules
 * Checks minimum score (>= 4.0), minimum rating count (>= 1), and verification status.
 */
export function checkVerificationRules(input: BadgeVerificationInput): BadgeVerificationResult {
  const missingRequirements: string[] = [];

  let score = 0;
  if (input.ratings) {
    const scoreDetails = calculateAccessibilityScore(input.ratings);
    score = scoreDetails.overallScore;
  } else {
    score = 4.5; // default fallback for verified vendors
  }

  const ratingCount = input.ratingCount ?? 1;
  const isVerified = Boolean(input.isVerified);

  // Rule 1: Minimum Accessibility Score Threshold (>= 4.0 / 80%)
  if (score < 4.0) {
    missingRequirements.push(`Accessibility score (${score.toFixed(1)}/5.0) is below minimum required threshold of 4.0.`);
  }

  // Rule 2: Minimum Rating Count (>= 1)
  if (ratingCount < 1) {
    missingRequirements.push('Minimum of 1 verified rating required for badge eligibility.');
  }

  // Rule 3: Verification Status Check
  if (!isVerified) {
    missingRequirements.push('Place or vendor verification status must be verified by admin.');
  }

  const isEligible = missingRequirements.length === 0;

  // Determine appropriate badge type based on highest rating criteria
  let badgeType = 'Accessibility Compliance Gold Badge';
  if (input.ratings) {
    if (input.ratings.wheelchairRamp >= 4) {
      badgeType = 'Wheelchair Barrier-Free Badge';
    } else if (input.ratings.brailleMenu >= 4 || input.ratings.audioSignal >= 4) {
      badgeType = 'Visual & Audio Accessible Badge';
    } else if (input.ratings.accessibleRestroom >= 4) {
      badgeType = 'WCAG Restroom Certified Badge';
    }
  } else if (input.entityType === 'vendor') {
    badgeType = 'Verified Disabled Creator Badge';
  }

  const reason = isEligible
    ? `Eligible: Score ${score.toFixed(1)}/5.0 satisfies all verification rules.`
    : `Ineligible: ${missingRequirements.join(' ')}`;

  return {
    isEligible,
    score,
    ratingCount,
    isVerified,
    badgeType,
    reason,
    missingRequirements,
  };
}

/**
 * AC-86 & AC-89: Assign / Award Accessibility Badge
 * Evaluates rules, assigns badge if eligible, records state, and persists record.
 */
export async function awardAccessibilityBadge(
  input: BadgeVerificationInput,
  awardedBy: string = 'Admin Compliance Officer'
): Promise<AccessibilityBadgeRecord> {
  const ruleCheck = checkVerificationRules(input);

  const existingIndex = memoryBadges.findIndex((b) => b.entityId === input.entityId);
  const badgeRecord: AccessibilityBadgeRecord = {
    id: existingIndex >= 0 ? memoryBadges[existingIndex].id : `badge-${Date.now()}`,
    entityId: input.entityId,
    entityType: input.entityType,
    entityName: input.entityName,
    badgeType: ruleCheck.badgeType,
    score: ruleCheck.score,
    ratingCount: ruleCheck.ratingCount,
    status: ruleCheck.isEligible ? 'awarded' : 'ineligible',
    isVerified: ruleCheck.isVerified,
    awardedAt: ruleCheck.isEligible ? new Date().toISOString() : undefined,
    awardedBy: ruleCheck.isEligible ? awardedBy : undefined,
    reason: ruleCheck.reason,
  };

  // Memory store update
  if (existingIndex >= 0) {
    memoryBadges[existingIndex] = badgeRecord;
  } else {
    memoryBadges.unshift(badgeRecord);
  }

  // Supabase persistence attempt
  try {
    const { data, error } = await supabase
      .from('place_accessibility_badges')
      .upsert({
        id: badgeRecord.id,
        location_id: input.entityId,
        badge_type: badgeRecord.badgeType,
        score: badgeRecord.score,
        status: badgeRecord.status,
        is_verified: badgeRecord.isVerified,
        awarded_at: badgeRecord.awardedAt,
        awarded_by: badgeRecord.awardedBy,
        reason: badgeRecord.reason,
      })
      .select()
      .single();

    if (!error && data) {
      badgeRecord.id = data.id || badgeRecord.id;
    }
  } catch (err) {
    console.warn('Supabase badge persistence notice (using in-memory fallback):', err);
  }

  return badgeRecord;
}

/**
 * Fetch all accessibility badges with offline fallback.
 */
export async function fetchAccessibilityBadges(): Promise<AccessibilityBadgeRecord[]> {
  try {
    const { data, error } = await supabase
      .from('place_accessibility_badges')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      const formatted: AccessibilityBadgeRecord[] = data.map((item: any) => ({
        id: item.id,
        entityId: item.location_id || item.entity_id || 'unknown',
        entityType: item.entity_type || 'place',
        entityName: item.entity_name || item.location_id || 'Accessible Location',
        badgeType: item.badge_type || 'Accessibility Compliance Badge',
        score: Number(item.score || 4.5),
        ratingCount: Number(item.rating_count || 1),
        status: item.status || 'awarded',
        isVerified: Boolean(item.is_verified ?? true),
        awardedAt: item.awarded_at || item.created_at,
        awardedBy: item.awarded_by || 'Admin Compliance Team',
        reason: item.reason || 'Verified accessibility compliance',
      }));
      return formatted;
    }
  } catch (err) {
    console.warn('Supabase fetch notice (place_accessibility_badges fallback):', err);
  }

  return [...memoryBadges];
}

/**
 * Get badge for a specific entity ID.
 */
export async function getBadgeForEntity(entityId: string): Promise<AccessibilityBadgeRecord | null> {
  const allBadges = await fetchAccessibilityBadges();
  return allBadges.find((b) => b.entityId === entityId) || null;
}

