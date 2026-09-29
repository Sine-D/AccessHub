import test from 'node:test';
import assert from 'node:assert/strict';
import { parseKeywords } from '../src/core/search/parser.ts';
import { routeForSearchQuery } from '../src/features/ai-assistant/utils/searchRouting.ts';
import { presentSearchFilters } from '../src/features/ai-assistant/utils/searchPresentation.ts';
import { matchesSearch } from '../src/core/search/matchSearch.ts';

test('product voice transcript becomes marketplace results with visible filters', () => {
  const query = parseKeywords('show home goods under 7000');
  assert.equal(query.intent, 'products');
  assert.equal(query.category, 'Home Goods');
  assert.equal(query.maxPrice, 7000);
  assert.equal(routeForSearchQuery(query), 'search_results');
  assert.deepEqual(
    presentSearchFilters(query).map((chip) => chip.label),
    ['Type: products', 'Category: Home Goods', 'Maximum: LKR 7,000'],
  );
  assert.equal(
    matchesSearch({ title: 'Accessible clock', category: 'Home Goods', price: 6200 }, query),
    true,
  );
});

test('location voice transcript routes to the filtered places directory', () => {
  const query = parseKeywords('find wheelchair ramps in Colombo');
  assert.equal(query.intent, 'places');
  assert.equal(query.location, 'colombo');
  assert.deepEqual(query.features, ['wheelchair_ramp']);
  assert.equal(routeForSearchQuery(query), 'map');
  assert.ok(presentSearchFilters(query).some((chip) => chip.label === 'Needs: Wheelchair ramp'));
});

test('job transcript remains on common accessible results screen', () => {
  const query = parseKeywords('find jobs');
  assert.equal(query.intent, 'jobs');
  assert.equal(routeForSearchQuery(query), 'search_results');
});

