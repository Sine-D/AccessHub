import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { presentPlaceFeature } from '../src/features/map/utils/placeFeaturePresentation.ts';
import { buildDirectionsUrl } from '../src/features/map/utils/directions.ts';
import { queryPlaceDetails, validatePlaceId } from '../server/place-details.mjs';

test('place accessibility features have readable labels and descriptions', () => {
  assert.deepEqual(presentPlaceFeature('wheelchair_ramp'), {
    id: 'wheelchair_ramp',
    label: 'Wheelchair ramp',
    description: 'A wheelchair ramp is reported at the entrance.',
  });
  assert.equal(presentPlaceFeature('Braille documents').label, 'Braille');
});

test('directions link encodes valid coordinates and rejects invalid values', () => {
  const url = new URL(buildDirectionsUrl({ lat: 6.9066, lng: 79.8673 }));
  assert.equal(url.hostname, 'www.google.com');
  assert.equal(url.searchParams.get('destination'), '6.9066,79.8673');
  assert.throws(() => buildDirectionsUrl({ lat: 200, lng: 79 }), /Invalid/);
});

test('place details endpoint validates IDs and maps a published database row', async () => {
  assert.equal(validatePlaceId('mp1'), 'mp1');
  assert.throws(() => validatePlaceId('../secret'), /Invalid place ID/);
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_ANON_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-key';
  try {
    const result = await queryPlaceDetails('mp1', async () =>
      new Response(JSON.stringify([{
        id: 'mp1',
        title: 'Test Place',
        type: 'service',
        lat: 6.9,
        lng: 79.8,
        address: 'Colombo',
        badge: 'Verified entrance',
        accessibility_features: ['wheelchair_ramp'],
        accessibility_rating: 4.5,
        image: '',
        description: 'Details',
        contact_phone: null,
        website: null,
        opening_hours: ['Monday 09:00–17:00'],
        community_rating: 4.7,
        community_review_count: 12,
        verification_badge: 'Community verified',
        last_verified_at: '2026-09-20T00:00:00.000Z',
      }]), { status: 200 }),
    );
    assert.equal(result.id, 'mp1');
    assert.equal(result.verification.rating, 4.7);
    assert.deepEqual(result.accessibilityFeatures, ['wheelchair_ramp']);
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL;
    else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_ANON_KEY;
    else process.env.SUPABASE_ANON_KEY = previousKey;
  }
});

test('details panel moves focus in and restores it on close', async () => {
  const source = await readFile(
    new URL('../src/features/map/components/PlaceDetailsPanel.tsx', import.meta.url),
    'utf8',
  );
  assert.match(source, /headingRef\.current\?\.focus/);
  assert.match(source, /returnFocusRef\.current\?\.focus/);
  assert.match(source, /tabIndex=\{-1\}/);
});

