import test from 'node:test';
import assert from 'node:assert/strict';
import { isCommunityHubVerificationPayload } from '../src/features/map/types/communityVerification.ts';
import { getCommunityVerification } from '../server/community-verification.mjs';
import { formatVerifiedDate, verificationStatusLabel } from '../src/features/map/utils/verificationPresentation.ts';

const validPayload = {
  version: 1,
  placeId: 'mp1',
  status: 'verified',
  rating: 4.8,
  reviewCount: 24,
  badge: 'Community verified',
  lastVerifiedAt: '2026-09-20T00:00:00.000Z',
};

async function withCommunityUrl(run) {
  const previous = process.env.COMMUNITY_HUB_BASE_URL;
  process.env.COMMUNITY_HUB_BASE_URL = 'https://community.example';
  try {
    await run();
  } finally {
    if (previous === undefined) delete process.env.COMMUNITY_HUB_BASE_URL;
    else process.env.COMMUNITY_HUB_BASE_URL = previous;
  }
}

test('contract accepts a matching valid Community Hub payload', () => {
  assert.equal(isCommunityHubVerificationPayload(validPayload, 'mp1'), true);
  assert.equal(isCommunityHubVerificationPayload(validPayload, 'mp2'), false);
  assert.equal(isCommunityHubVerificationPayload({ ...validPayload, rating: 9 }, 'mp1'), false);
});

test('server retrieves and maps a valid verification summary', async () => {
  await withCommunityUrl(async () => {
    const summary = await getCommunityVerification('mp1', null, async (url, options) => {
      assert.equal(url.pathname, '/api/places/mp1/verification-summary');
      assert.equal(options.headers.Accept, 'application/json');
      return new Response(JSON.stringify(validPayload), { status: 200 });
    });
    assert.deepEqual(summary, {
      status: 'verified',
      rating: 4.8,
      reviewCount: 24,
      badge: 'Community verified',
      lastVerifiedAt: '2026-09-20T00:00:00.000Z',
    });
  });
});

test('network and malformed responses preserve the directory fallback', async () => {
  const fallback = {
    status: 'unverified',
    rating: null,
    reviewCount: 0,
    badge: null,
    lastVerifiedAt: null,
  };
  await withCommunityUrl(async () => {
    const malformed = await getCommunityVerification('mp1', fallback, async () =>
      new Response(JSON.stringify({ ...validPayload, placeId: 'wrong-id' }), { status: 200 }),
    );
    const failed = await getCommunityVerification('mp1', fallback, async () => {
      throw new Error('offline');
    });
    assert.equal(malformed, fallback);
    assert.equal(failed, fallback);
  });
});

test('presentation clearly distinguishes verified and missing information', () => {
  assert.equal(verificationStatusLabel(null), 'Verification unavailable');
  assert.equal(verificationStatusLabel(validPayload), 'Community verified');
  assert.match(formatVerifiedDate(validPayload.lastVerifiedAt), /2026/);
  assert.equal(formatVerifiedDate(null), 'Not yet verified');
});
