import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAccessibilityScore,
  checkVerificationRules,
  awardAccessibilityBadge,
  getBadgeForEntity,
  fetchAccessibilityBadges,
} from '../src/services/accessibilityBadgeService.ts';

test('AC-87: Calculate accessibility score correctly', () => {
  const ratings = {
    wheelchairRamp: 5,
    brailleMenu: 4,
    audioSignal: 4,
    accessibleRestroom: 5,
  };

  const scoreDetails = calculateAccessibilityScore(ratings);

  assert.equal(scoreDetails.wheelchairRamp, 5);
  assert.equal(scoreDetails.brailleMenu, 4);
  assert.equal(scoreDetails.audioSignal, 4);
  assert.equal(scoreDetails.accessibleRestroom, 5);
  assert.equal(scoreDetails.overallScore, 4.5);
  assert.equal(scoreDetails.criteriaAverage, 4.5);
  assert.equal(scoreDetails.percentage, 90);
});

test('AC-88: Verification rules checked for eligibility', () => {
  // Case A: Eligible (score >= 4.0, count >= 1, verified)
  const eligibleInput = {
    entityId: 'loc-test-1',
    entityType: 'place',
    entityName: 'Accessible Library',
    ratings: { wheelchairRamp: 4, brailleMenu: 4, audioSignal: 4, accessibleRestroom: 4 },
    ratingCount: 5,
    isVerified: true,
  };

  const eligibleResult = checkVerificationRules(eligibleInput);
  assert.equal(eligibleResult.isEligible, true);
  assert.equal(eligibleResult.score, 4.0);
  assert.equal(eligibleResult.missingRequirements.length, 0);

  // Case B: Ineligible due to low score (score < 4.0)
  const lowScoreInput = {
    entityId: 'loc-test-2',
    entityType: 'place',
    entityName: 'Low Accessibility Shop',
    ratings: { wheelchairRamp: 2, brailleMenu: 3, audioSignal: 2, accessibleRestroom: 3 },
    ratingCount: 4,
    isVerified: true,
  };

  const lowScoreResult = checkVerificationRules(lowScoreInput);
  assert.equal(lowScoreResult.isEligible, false);
  assert.equal(lowScoreResult.score, 2.5);
  assert.ok(lowScoreResult.missingRequirements.some((r) => r.includes('minimum required threshold')));

  // Case C: Ineligible due to unverified status
  const unverifiedInput = {
    entityId: 'loc-test-3',
    entityType: 'place',
    entityName: 'Unverified Venue',
    ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 5, accessibleRestroom: 5 },
    ratingCount: 2,
    isVerified: false,
  };

  const unverifiedResult = checkVerificationRules(unverifiedInput);
  assert.equal(unverifiedResult.isEligible, false);
  assert.ok(unverifiedResult.missingRequirements.some((r) => r.includes('must be verified')));
});

test('AC-86 & AC-89: Assign badge to eligible entity and record ineligible state', async () => {
  const eligibleEntity = {
    entityId: 'loc-eligible-100',
    entityType: 'place',
    entityName: 'Colombo Central Accessible Terminal',
    ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 4, accessibleRestroom: 5 },
    ratingCount: 10,
    isVerified: true,
  };

  const badgeRecord = await awardAccessibilityBadge(eligibleEntity, 'Compliance Board');

  assert.equal(badgeRecord.status, 'awarded');
  assert.equal(badgeRecord.score, 4.75);
  assert.equal(badgeRecord.isVerified, true);
  assert.ok(badgeRecord.badgeType.length > 0);
  assert.equal(badgeRecord.awardedBy, 'Compliance Board');

  // Test ineligible entity badge recording
  const ineligibleEntity = {
    entityId: 'loc-ineligible-200',
    entityType: 'place',
    entityName: 'Sub-Standard Outlet',
    ratings: { wheelchairRamp: 1, brailleMenu: 2, audioSignal: 1, accessibleRestroom: 2 },
    ratingCount: 1,
    isVerified: false,
  };

  const ineligibleRecord = await awardAccessibilityBadge(ineligibleEntity, 'Admin Inspector');
  assert.equal(ineligibleRecord.status, 'ineligible');
  assert.ok(ineligibleRecord.reason.includes('Ineligible'));
});

test('Badge persistence and retrieval', async () => {
  const testId = `loc-persist-${Date.now()}`;
  const input = {
    entityId: testId,
    entityType: 'place',
    entityName: 'Persisted Accessible Museum',
    ratings: { wheelchairRamp: 5, brailleMenu: 5, audioSignal: 5, accessibleRestroom: 5 },
    ratingCount: 8,
    isVerified: true,
  };

  await awardAccessibilityBadge(input, 'Admin Officer');

  const retrieved = await getBadgeForEntity(testId);
  assert.ok(retrieved !== null);
  assert.equal(retrieved.entityId, testId);
  assert.equal(retrieved.status, 'awarded');
  assert.equal(retrieved.score, 5.0);
});

test('AC-90: Badge display data structure verification', async () => {
  const allBadges = await fetchAccessibilityBadges();
  assert.ok(Array.isArray(allBadges));
  assert.ok(allBadges.length > 0);

  const sampleBadge = allBadges[0];
  assert.ok(typeof sampleBadge.badgeType === 'string');
  assert.ok(typeof sampleBadge.score === 'number');
  assert.ok(typeof sampleBadge.status === 'string');
  assert.ok(typeof sampleBadge.isVerified === 'boolean');
});

