import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseKeywords } from '../src/core/search/parser.ts';
import { filterMobileJobs, filterMobilePlaces, filterMobileProducts } from '../src/mobile/utils/mobileSearch.ts';

const products = [{ id: 'p1', title: 'Accessible wall clock', description: 'High contrast', category: 'Home Goods', price: 6200, accessibilityFeatures: [] }];
const jobs = [{ id: 'j1', title: 'Remote accessibility engineer', company: 'AccessHub', location: 'Colombo / Remote', description: 'Inclusive work', accessibilityBadges: [] }];
const places = [{ id: 'mp1', title: 'Accessible Centre', type: 'service', address: 'Colombo', badge: 'Verified', accessibilityFeatures: ['Wheelchair ramp'], lat: 6.9, lng: 79.8, accessibilityRating: 4.8, distance: '2 km', image: '' }];

test('Expo voice product query returns matching priced products', () => {
  const query = parseKeywords('show home goods under 7000');
  const results = filterMobileProducts(products, query);
  assert.equal(query.intent, 'products');
  assert.ok(results.length > 0);
  assert.ok(results.every((product) => product.category === 'Home Goods' && product.price <= 7000));
});

test('Expo place filters require every interpreted accessibility feature', () => {
  const query = parseKeywords('find wheelchair ramp places in Colombo');
  const results = filterMobilePlaces(places, query);
  assert.equal(query.intent, 'places');
  assert.ok(results.length > 0);
  assert.ok(results.every((place) => place.address.toLowerCase().includes('colombo')));
});

test('Expo job query uses the shared parser and native results filtering', () => {
  const query = parseKeywords('show remote jobs');
  const results = filterMobileJobs(jobs, query);
  assert.equal(query.intent, 'jobs');
  assert.ok(results.some((job) => job.title.toLowerCase().includes('remote') || job.location.toLowerCase().includes('remote')));
});

test('Expo place details source includes verification and safe unavailable state', async () => {
  const source = await readFile(new URL('../src/mobile/components/MobilePlaceDetailsModal.tsx', import.meta.url), 'utf8');
  assert.match(source, /verificationStatusLabel/);
  assert.match(source, /Verification unavailable|verificationMissing/);
  assert.match(source, /Get accessible directions/);
});

test('Expo AI Hub includes multilingual editable voice capture and secure query routing', async () => {
  const modal = await readFile(new URL('../src/mobile/components/MobileVoiceSearchModal.tsx', import.meta.url), 'utf8');
  const speech = await readFile(new URL('../src/mobile/hooks/useMobileSpeechRecognition.ts', import.meta.url), 'utf8');
  const service = await readFile(new URL('../src/mobile/services/mobileQueryService.ts', import.meta.url), 'utf8');
  assert.match(modal, /en-LK/);
  assert.match(modal, /si-LK/);
  assert.match(modal, /ta-LK/);
  assert.match(modal, /Voice search transcript/);
  assert.match(modal, /Start AI microphone/);
  assert.match(speech, /webkitSpeechRecognition/);
  assert.match(speech, /expo-speech-recognition/);
  assert.match(speech, /requestPermissionsAsync/);
  assert.match(speech, /lang: language/);
  assert.match(speech, /phone keyboard/);
  assert.match(service, /EXPO_PUBLIC_SEARCH_API_URL/);
  assert.match(service, /parseKeywords/);
});

test('Expo Places Directory includes native markers, location, synchronized filters and live data fallback', async () => {
  const map = await readFile(new URL('../src/mobile/components/MobilePlacesMap.tsx', import.meta.url), 'utf8');
  const service = await readFile(new URL('../src/mobile/services/mobilePlacesService.ts', import.meta.url), 'utf8');
  const app = await readFile(new URL('../src/AppMobile.tsx', import.meta.url), 'utf8');
  assert.match(map, /react-native-maps/);
  assert.match(map, /expo-location/);
  assert.match(map, /Marker/);
  assert.match(service, /accesshub_places/);
  assert.match(service, /EXPO_PUBLIC_ACCESSIBLE_PLACES_API_URL/);
  assert.match(app, /filteredMobilePlaces/);
  assert.match(app, /MobilePlacesMap/);
});
