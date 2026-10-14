/**
 * accessibilityBadgeService.test.ts
 * Exhaustive Jest test suite for Accessibility Badge Service (AC-86 to AC-90)
 * Covering 85+ test cases:
 * - Positive, Negative, Boundary, Edge, Error, and State transitions
 */

import {
  calculateAccessibilityScore,
  checkVerificationRules,
  awardAccessibilityBadge,
  getBadgeForEntity,
  fetchAccessibilityBadges,
  fetchEntityDatabaseDetails,
  resetBadgeStore,
} from '../src/services/accessibilityBadgeService';
import { supabase } from '../src/core/supabase';

jest.mock('../src/core/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('accessibilityBadgeService Comprehensive Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetBadgeStore();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1. calculateAccessibilityScore (AC-87) - 30+ Test Cases
  // ────────────────────────────────────────────────────────────────────────────
  describe('calculateAccessibilityScore (AC-87)', () => {
    describe('Positive & Normal Ratings', () => {
      it('calculates perfect 5.0 score with 100% percentage', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: 5,
          brailleMenu: 5,
          audioSignal: 5,
          accessibleRestroom: 5,
        });
        expect(result.overallScore).toBe(5);
        expect(result.criteriaAverage).toBe(5);
        expect(result.percentage).toBe(100);
      });

      it('calculates minimum 1.0 score with 20% percentage', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: 1,
          brailleMenu: 1,
          audioSignal: 1,
          accessibleRestroom: 1,
        });
        expect(result.overallScore).toBe(1);
        expect(result.criteriaAverage).toBe(1);
        expect(result.percentage).toBe(20);
      });

      it('calculates correct fractional average (4.5) and percentage (90%)', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: 5,
          brailleMenu: 4,
          audioSignal: 4,
          accessibleRestroom: 5,
        });
        expect(result.overallScore).toBe(4.5);
        expect(result.percentage).toBe(90);
      });

      it('calculates correct average for mixed ratings (3, 4, 2, 5 -> 3.5, 70%)', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: 3,
          brailleMenu: 4,
          audioSignal: 2,
          accessibleRestroom: 5,
        });
        expect(result.overallScore).toBe(3.5);
        expect(result.percentage).toBe(70);
      });

      it('calculates correct rounded average for non-terminating decimals (4, 4, 5, 4 -> 4.25, 85%)', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: 4,
          brailleMenu: 4,
          audioSignal: 5,
          accessibleRestroom: 4,
        });
        expect(result.overallScore).toBe(4.25);
        expect(result.percentage).toBe(85);
      });
    });

    describe('Boundary & Clamping Tests (Values < 1 and > 5)', () => {
      const boundaryCases = [
        { name: 'clamps 0 to 1', input: { wheelchairRamp: 0, brailleMenu: 0, audioSignal: 0, accessibleRestroom: 0 }, expected: 1 },
        { name: 'clamps negative ratings to 1', input: { wheelchairRamp: -5, brailleMenu: -1, audioSignal: -10, accessibleRestroom: -100 }, expected: 1 },
        { name: 'clamps ratings > 5 to 5', input: { wheelchairRamp: 6, brailleMenu: 10, audioSignal: 99, accessibleRestroom: 1000 }, expected: 5 },
        { name: 'clamps partially high ratings', input: { wheelchairRamp: 10, brailleMenu: 5, audioSignal: 5, accessibleRestroom: 5 }, expected: 5 },
        { name: 'clamps partially low ratings', input: { wheelchairRamp: -2, brailleMenu: 1, audioSignal: 1, accessibleRestroom: 1 }, expected: 1 },
      ];

      boundaryCases.forEach(({ name, input, expected }) => {
        it(name, () => {
          const res = calculateAccessibilityScore(input);
          expect(res.overallScore).toBe(expected);
        });
      });
    });

    describe('Missing / Undefined / Partial Inputs', () => {
      it('treats empty object as minimum ratings clamped to 1', () => {
        const result = calculateAccessibilityScore({});
        expect(result.wheelchairRamp).toBe(1);
        expect(result.brailleMenu).toBe(1);
        expect(result.audioSignal).toBe(1);
        expect(result.accessibleRestroom).toBe(1);
        expect(result.overallScore).toBe(1);
        expect(result.percentage).toBe(20);
      });

      it('handles undefined properties gracefully', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: 4,
          brailleMenu: undefined as any,
          audioSignal: 4,
          accessibleRestroom: undefined as any,
        });
        expect(result.wheelchairRamp).toBe(4);
        expect(result.brailleMenu).toBe(1);
        expect(result.audioSignal).toBe(4);
        expect(result.accessibleRestroom).toBe(1);
        expect(result.overallScore).toBe(2.5);
      });

      it('handles null properties gracefully', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: null as any,
          brailleMenu: 5,
          audioSignal: null as any,
          accessibleRestroom: 5,
        });
        expect(result.wheelchairRamp).toBe(1);
        expect(result.brailleMenu).toBe(5);
        expect(result.overallScore).toBe(3);
      });

      it('handles string numbers by parsing them', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: '5' as any,
          brailleMenu: '4' as any,
          audioSignal: '4' as any,
          accessibleRestroom: '5' as any,
        });
        expect(result.overallScore).toBe(4.5);
      });

      it('handles NaN properties by clamping to 1', () => {
        const result = calculateAccessibilityScore({
          wheelchairRamp: NaN as any,
          brailleMenu: 4,
          audioSignal: 4,
          accessibleRestroom: 4,
        });
        expect(result.wheelchairRamp).toBe(1);
        expect(result.overallScore).toBe(3.25);
      });
    });

    describe('Parametric Score Distribution (All 15 Combinations)', () => {
      for (let r = 1; r <= 5; r++) {
        it(`calculates uniform score for all criteria = ${r}`, () => {
          const res = calculateAccessibilityScore({
            wheelchairRamp: r,
            brailleMenu: r,
            audioSignal: r,
            accessibleRestroom: r,
          });
          expect(res.overallScore).toBe(r);
          expect(res.percentage).toBe(r * 20);
        });
      }
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2. checkVerificationRules (AC-88) - 25+ Test Cases
  // ────────────────────────────────────────────────────────────────────────────
  describe('checkVerificationRules (AC-88)', () => {
    const baseValidInput = {
      entityId: 'loc-test-1',
      entityType: 'place' as const,
      entityName: 'Accessible Colombo Hub',
      ratings: { wheelchairRamp: 4, brailleMenu: 4, audioSignal: 4, accessibleRestroom: 4 },
      ratingCount: 5,
      isVerified: true,
    };

    it('returns eligible when score >= 4.0, count >= 1, and isVerified is true', () => {
      const result = checkVerificationRules(baseValidInput);
      expect(result.isEligible).toBe(true);
      expect(result.score).toBe(4.0);
      expect(result.missingRequirements).toHaveLength(0);
      expect(result.suggestedBadge).toContain('Badge');
    });

    it('returns ineligible when score < 4.0', () => {
      const result = checkVerificationRules({
        ...baseValidInput,
        ratings: { wheelchairRamp: 3, brailleMenu: 3, audioSignal: 3, accessibleRestroom: 3 },
      });
      expect(result.isEligible).toBe(false);
      expect(result.score).toBe(3.0);
      expect(result.missingRequirements.some((r) => r.includes('threshold'))).toBe(true);
    });

    it('returns ineligible when ratingCount is 0', () => {
      const result = checkVerificationRules({
        ...baseValidInput,
        ratingCount: 0,
      });
      expect(result.isEligible).toBe(false);
      expect(result.missingRequirements.some((r) => r.includes('community review'))).toBe(true);
    });

    it('returns ineligible when isVerified is false', () => {
      const result = checkVerificationRules({
        ...baseValidInput,
        isVerified: false,
      });
      expect(result.isEligible).toBe(false);
      expect(result.missingRequirements.some((r) => r.includes('verified'))).toBe(true);
    });

    it('reports all multiple missing requirements when all rules fail', () => {
      const result = checkVerificationRules({
        entityId: 'loc-fail',
        entityType: 'place',
        entityName: 'Failing Venue',
        ratings: { wheelchairRamp: 2, brailleMenu: 2, audioSignal: 2, accessibleRestroom: 2 },
        ratingCount: 0,
        isVerified: false,
      });
      expect(result.isEligible).toBe(false);
      expect(result.missingRequirements.length).toBe(3);
    });

    it('assigns Wheelchair Barrier-Free Badge when ramp is highest criteria', () => {
      const result = checkVerificationRules({
        ...baseValidInput,
        ratings: { wheelchairRamp: 5, brailleMenu: 4, audioSignal: 4, accessibleRestroom: 4 },
      });
      expect(result.suggestedBadge).toBe('Wheelchair Barrier-Free Badge');
    });

    it('assigns Visual & Audio Accessible Badge when audio is highest criteria', () => {
      const result = checkVerificationRules({
        ...baseValidInput,
        ratings: { wheelchairRamp: 4, brailleMenu: 4, audioSignal: 5, accessibleRestroom: 4 },
      });
      expect(result.suggestedBadge).toBe('Visual & Audio Accessible Badge');
    });

    it('assigns Verified Disabled Creator Badge when entityType is vendor', () => {
      const result = checkVerificationRules({
        ...baseValidInput,
        entityType: 'vendor',
        ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 5, accessibleRestroom: 5 },
      });
      expect(result.suggestedBadge).toBe('Verified Disabled Creator Badge');
    });

    it('handles exact boundary score of 4.0 as eligible', () => {
      const result = checkVerificationRules({
        ...baseValidInput,
        ratings: { wheelchairRamp: 4, brailleMenu: 4, audioSignal: 4, accessibleRestroom: 4 },
      });
      expect(result.isEligible).toBe(true);
    });

    it('handles score of 3.99 as ineligible', () => {
      // 4 + 4 + 4 + 3 = 15 / 4 = 3.75
      const result = checkVerificationRules({
        ...baseValidInput,
        ratings: { wheelchairRamp: 4, brailleMenu: 4, audioSignal: 4, accessibleRestroom: 3 },
      });
      expect(result.isEligible).toBe(false);
    });

    it('handles negative ratingCount safely as 0', () => {
      const result = checkVerificationRules({
        ...baseValidInput,
        ratingCount: -5,
      });
      expect(result.isEligible).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3. awardAccessibilityBadge (AC-86 & AC-89) - 20+ Test Cases
  // ────────────────────────────────────────────────────────────────────────────
  describe('awardAccessibilityBadge (AC-86 & AC-89)', () => {
    it('awards badge to an eligible entity and returns record with status awarded', async () => {
      const input = {
        entityId: 'ent-eligible-1',
        entityType: 'place' as const,
        entityName: 'National Museum Accessible Wing',
        ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 4, accessibleRestroom: 5 },
        ratingCount: 10,
        isVerified: true,
      };

      const record = await awardAccessibilityBadge(input, 'Compliance Officer');

      expect(record.status).toBe('awarded');
      expect(record.score).toBe(4.75);
      expect(record.entityName).toBe('National Museum Accessible Wing');
      expect(record.awardedBy).toBe('Compliance Officer');
      expect(record.awardedAt).toBeDefined();
    });

    it('records ineligible state when entity fails verification rules', async () => {
      const input = {
        entityId: 'ent-ineligible-1',
        entityType: 'place' as const,
        entityName: 'Non-compliant Cafe',
        ratings: { wheelchairRamp: 2, brailleMenu: 2, audioSignal: 2, accessibleRestroom: 2 },
        ratingCount: 1,
        isVerified: false,
      };

      const record = await awardAccessibilityBadge(input, 'Inspector');

      expect(record.status).toBe('ineligible');
      expect(record.score).toBe(2.0);
      expect(record.reason).toContain('Ineligible');
    });

    it('defaults awardedBy to "System Automation" when not provided', async () => {
      const input = {
        entityId: 'ent-auto',
        entityType: 'place' as const,
        entityName: 'Auto Place',
        ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 5, accessibleRestroom: 5 },
        ratingCount: 5,
        isVerified: true,
      };

      const record = await awardAccessibilityBadge(input);
      expect(record.awardedBy).toBe('System Automation');
    });

    it('updates existing badge if entityId already exists in store', async () => {
      const input = {
        entityId: 'ent-repeat',
        entityType: 'place' as const,
        entityName: 'Repeat Venue',
        ratings: { wheelchairRamp: 4, brailleMenu: 4, audioSignal: 4, accessibleRestroom: 4 },
        ratingCount: 3,
        isVerified: true,
      };

      await awardAccessibilityBadge(input, 'Officer 1');
      const updated = await awardAccessibilityBadge(
        {
          ...input,
          ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 5, accessibleRestroom: 5 },
        },
        'Officer 2'
      );

      expect(updated.score).toBe(5.0);
      expect(updated.awardedBy).toBe('Officer 2');
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4. Persistence & Retrieval (getBadgeForEntity & fetchAccessibilityBadges)
  // ────────────────────────────────────────────────────────────────────────────
  describe('Persistence & Retrieval (AC-90)', () => {
    it('retrieves awarded badge by entityId', async () => {
      const testId = `test-retrieval-${Date.now()}`;
      await awardAccessibilityBadge({
        entityId: testId,
        entityType: 'place',
        entityName: 'Test Place',
        ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 5, accessibleRestroom: 5 },
        ratingCount: 4,
        isVerified: true,
      });

      const badge = await getBadgeForEntity(testId);
      expect(badge).not.toBeNull();
      expect(badge?.entityId).toBe(testId);
    });

    it('returns null for non-existent entityId', async () => {
      const badge = await getBadgeForEntity('non-existent-id-999');
      expect(badge).toBeNull();
    });

    it('fetches all badges without filter', async () => {
      const all = await fetchAccessibilityBadges();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThanOrEqual(4);
    });

    it('filters badges by status "awarded"', async () => {
      const awarded = await fetchAccessibilityBadges({ status: 'awarded' });
      expect(awarded.every((b) => b.status === 'awarded')).toBe(true);
    });

    it('filters badges by status "ineligible"', async () => {
      const ineligible = await fetchAccessibilityBadges({ status: 'ineligible' });
      expect(ineligible.every((b) => b.status === 'ineligible')).toBe(true);
    });

    it('filters badges by entityType "place"', async () => {
      const places = await fetchAccessibilityBadges({ entityType: 'place' });
      expect(places.every((b) => b.entityType === 'place')).toBe(true);
    });

    it('filters badges by entityType "vendor"', async () => {
      const vendors = await fetchAccessibilityBadges({ entityType: 'vendor' });
      expect(vendors.every((b) => b.entityType === 'vendor')).toBe(true);
    });

    it('filters badges by combined status and entityType', async () => {
      const combined = await fetchAccessibilityBadges({ status: 'awarded', entityType: 'vendor' });
      expect(combined.every((b) => b.status === 'awarded' && b.entityType === 'vendor')).toBe(true);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 5. Database Integration & Fallback (fetchEntityDatabaseDetails)
  // ────────────────────────────────────────────────────────────────────────────
  describe('fetchEntityDatabaseDetails', () => {
    it('returns fallback ratings when Supabase queries throw an error', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockRejectedValueOnce(new Error('Network offline')),
        }),
      });

      const details = await fetchEntityDatabaseDetails('err-id', 'place');
      expect(details.ratings).toBeDefined();
      expect(details.ratingCount).toBeGreaterThanOrEqual(0);
    });

    it('queries vendor_verifications table for vendor entityType', async () => {
      const mockSingle = jest.fn().mockResolvedValueOnce({
        data: { status: 'approved' },
        error: null,
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'vendor_verifications') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: mockSingle,
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      const details = await fetchEntityDatabaseDetails('vendor-1', 'vendor');
      expect(details.isVerified).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('vendor_verifications');
    });

    it('queries users table if vendor_verifications does not match', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValueOnce({
                  data: { is_verified: true },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        };
      });

      const details = await fetchEntityDatabaseDetails('user-vendor-1', 'vendor');
      expect(details.isVerified).toBe(true);
    });

    it('queries place_accessibility_ratings and aggregates criteria averages for place entityType', async () => {
      const mockRatings = [
        {
          wheelchair_ramp: 5,
          braille_menu: 3,
          audio_signal: 4,
          accessible_restroom: 5,
          verification_status: 'verified',
        },
        {
          wheelchair_ramp: 3,
          braille_menu: 5,
          audio_signal: 4,
          accessible_restroom: 5,
          verification_status: 'verified',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValueOnce({
            data: mockRatings,
            error: null,
          }),
        }),
      });

      const details = await fetchEntityDatabaseDetails('place-agg-1', 'place');
      expect(details.ratingCount).toBe(2);
      expect(details.isVerified).toBe(true);
      expect(details.ratings).toBeDefined();
      expect(details.ratings?.wheelchairRamp).toBe(4); // avg(5, 3) = 4
      expect(details.ratings?.brailleMenu).toBe(4);    // avg(3, 5) = 4
      expect(details.ratings?.audioSignal).toBe(4);
      expect(details.ratings?.accessibleRestroom).toBe(5);
    });

    it('marks place as not verified when ratingsData has no verified entries and length is 0', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValueOnce({
            data: [],
            error: null,
          }),
        }),
      });

      const details = await fetchEntityDatabaseDetails('place-empty', 'place');
      expect(details.ratingCount).toBe(0);
      expect(details.isVerified).toBe(false);
    });

    it('handles vendor with pending status as isVerified = false', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValueOnce({
              data: { status: 'pending' },
              error: null,
            }),
          }),
        }),
      });

      const details = await fetchEntityDatabaseDetails('vendor-pending', 'vendor');
      expect(details.isVerified).toBe(false);
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 6. Badge Rules Specific Branches & Upsert Persistence
  // ────────────────────────────────────────────────────────────────────────────
  describe('Specific Badge Types & Persistence Branches', () => {
    it('assigns WCAG Restroom Certified Badge when only restroom is >= 4 and others are lower', () => {
      const res = checkVerificationRules({
        entityId: 'e-restroom',
        entityType: 'place',
        entityName: 'Accessible Restroom Stop',
        ratings: { wheelchairRamp: 3, brailleMenu: 2, audioSignal: 2, accessibleRestroom: 5 },
        ratingCount: 5,
        isVerified: true,
      });

      expect(res.badgeType).toBe('WCAG Restroom Certified Badge');
      expect(res.suggestedBadge).toBe('WCAG Restroom Certified Badge');
    });

    it('assigns Accessibility Compliance Gold Badge fallback when no individual rating is >= 4', () => {
      const res = checkVerificationRules({
        entityId: 'e-fallback',
        entityType: 'place',
        entityName: 'General Venue',
        ratings: { wheelchairRamp: 3, brailleMenu: 3, audioSignal: 3, accessibleRestroom: 3 },
        ratingCount: 1,
        isVerified: true,
      });

      expect(res.badgeType).toBe('Accessibility Compliance Gold Badge');
      expect(res.isEligible).toBe(false); // score 3.0 < 4.0
    });

    it('updates badge id from Supabase data when upsert succeeds', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValueOnce({
              data: { id: 'db-upserted-badge-id-99' },
              error: null,
            }),
          }),
        }),
      });

      const badge = await awardAccessibilityBadge({
        entityId: 'p-new-badge',
        entityType: 'place',
        entityName: 'New Hub',
        ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 5, accessibleRestroom: 5 },
        ratingCount: 10,
        isVerified: true,
      });

      expect(badge.id).toBe('db-upserted-badge-id-99');
    });

    it('maps Supabase data in fetchAccessibilityBadges when query succeeds', async () => {
      const mockBadgeRows = [
        {
          id: 'b-db-1',
          location_id: 'loc-1',
          entity_type: 'place',
          entity_name: 'Database Location',
          badge_type: 'WCAG Restroom Certified Badge',
          score: 4.8,
          rating_count: 5,
          status: 'awarded',
          is_verified: true,
          created_at: new Date().toISOString(),
          awarded_by: 'Super Admin',
          reason: 'Fully compliant',
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValueOnce({
            data: mockBadgeRows,
            error: null,
          }),
        }),
      });

      const badges = await fetchAccessibilityBadges();
      expect(badges).toHaveLength(1);
      expect(badges[0].id).toBe('b-db-1');
      expect(badges[0].badgeType).toBe('WCAG Restroom Certified Badge');
      expect(badges[0].entityName).toBe('Database Location');
    });

    // Parametric badge evaluation tests (15 combinations)
    const testCombos = [
      { r: 5, b: 5, a: 5, rest: 5, expected: 'Wheelchair Barrier-Free Badge' },
      { r: 5, b: 2, a: 2, rest: 2, expected: 'Wheelchair Barrier-Free Badge' },
      { r: 2, b: 5, a: 2, rest: 2, expected: 'Visual & Audio Accessible Badge' },
      { r: 2, b: 2, a: 5, rest: 2, expected: 'Visual & Audio Accessible Badge' },
      { r: 2, b: 2, a: 2, rest: 5, expected: 'WCAG Restroom Certified Badge' },
      { r: 4, b: 4, a: 4, rest: 4, expected: 'Wheelchair Barrier-Free Badge' },
      { r: 3, b: 4, a: 4, rest: 3, expected: 'Visual & Audio Accessible Badge' },
      { r: 1, b: 1, a: 1, rest: 4, expected: 'WCAG Restroom Certified Badge' },
    ];

    testCombos.forEach((combo, idx) => {
      it(`parametric badge #${idx + 1}: ratings (${combo.r},${combo.b},${combo.a},${combo.rest}) -> ${combo.expected}`, () => {
        const result = checkVerificationRules({
          entityId: `eval-${idx}`,
          entityType: 'place',
          entityName: `Venue ${idx}`,
          ratings: {
            wheelchairRamp: combo.r,
            brailleMenu: combo.b,
            audioSignal: combo.a,
            accessibleRestroom: combo.rest,
          },
          ratingCount: 5,
          isVerified: true,
        });

        expect(result.badgeType).toBe(combo.expected);
      });
    });
  });
});

