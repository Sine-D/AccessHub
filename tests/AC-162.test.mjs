import test from 'node:test';
import assert from 'node:assert/strict';

import { parseKeywords } from '../src/core/search/parser.ts';
import { matchesSearch } from '../src/core/search/matchSearch.ts';
import { filterPlaces } from '../src/features/map/utils/accessibilityFilters.ts';
import { mockMapPins } from '../src/mock/data.ts';
import { interpret } from '../server/interpret.mjs';
import { searchSchema, interpretOpenAI } from '../server/openai.mjs';
import { buildGeminiRequest, interpretGemini } from '../server/gemini.mjs';

test('Kandy wheelchair café extracts all entities', () => {
  const q = parseKeywords('Find wheelchair-accessible cafés near Kandy');

  assert.equal(q.intent, 'places');
  assert.equal(q.category, 'cafe');
  assert.equal(q.location, 'kandy');
  assert.deepEqual(q.features, ['wheelchair_ramp']);
  assert.equal(q.keywords, '');
});

test('conversational misspellings still find a wheelchair-accessible restaurant', () => {
  const q = parseKeywords('can you find me an resturant ith wheelhair ramps');

  assert.equal(q.intent, 'places');
  assert.equal(q.category, 'restaurant');
  assert.deepEqual(q.features, ['wheelchair_ramp']);
  assert.equal(q.keywords, '');
  assert.equal(q.needsClarification, false);
  const results = filterPlaces(mockMapPins, q.features).filter((place) => matchesSearch(place, q));
  assert.ok(results.some((place) => place.title === 'Access Garden Restaurant'));
});

test('Sinhala restaurant and wheelchair-ramp query is interpreted', () => {
  const q = parseKeywords('මට කොළඹ රෝද පුටු සඳහා බෑවුමක් ඇති අවන්හලක් හොයන්න', 'si-LK');

  assert.equal(q.intent, 'places');
  assert.equal(q.category, 'restaurant');
  assert.equal(q.location, 'colombo');
  assert.deepEqual(q.features, ['wheelchair_ramp']);
  assert.equal(q.keywords, '');
  assert.equal(q.needsClarification, false);
  const results = filterPlaces(mockMapPins, q.features).filter((place) => matchesSearch(place, q));
  assert.ok(results.some((place) => place.title === 'Access Garden Restaurant'));
});

test('price range and product feature', () => {
  const q = parseKeywords('Find Braille products between 2,000 and 7,000');

  assert.equal(q.minPrice, 2000);
  assert.equal(q.maxPrice, 7000);
  assert.deepEqual(q.features, ['braille']);
});

test('actual records obey price bounds', () => {
  const q = parseKeywords('Find products under 5000');

  assert.equal(matchesSearch({ title: 'A', price: 4500 }, q), true);
  assert.equal(matchesSearch({ title: 'B', price: 6500 }, q), false);
});

test('disabled AI uses keyword source', async () => {
  const r = await interpret({ text: 'Find places in Kandy', locale: 'en-LK' });

  assert.equal(r.source, 'keyword');
});

test('strict schema and mocked structured response', async () => {
  process.env.OPENAI_MODEL = 'test-model';

  assert.equal(searchSchema.additionalProperties, false);

  const q = parseKeywords('Find products');
  const r = await interpretOpenAI(
    { text: 'Find products', locale: 'en-LK' },
    async () => ({
      ok: true,
      json: async () => ({
        status: 'completed',
        output: [
          {
            type: 'message',
            content: [
              {
                type: 'output_text',
                text: JSON.stringify(q),
              },
            ],
          },
        ],
      }),
    }),
  );

  assert.deepEqual(r, q);
});

test('Gemini returns a validated structured search', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GEMINI_MODEL = 'gemini-3.8-flash';

  try {
    const q = parseKeywords('Find products');
    const request = buildGeminiRequest({ text: 'Find products', locale: 'en-LK' });
    assert.equal(request.generationConfig.responseMimeType, 'application/json');
    assert.equal(request.generationConfig.responseSchema.properties.category.nullable, true);
    assert.equal('additionalProperties' in request.generationConfig.responseSchema, false);

    const result = await interpretGemini(
      { text: 'Find products', locale: 'en-LK' },
      async (url, options) => {
        assert.match(url, /models\/gemini-3.8-flash:generateContent$/);
        assert.equal(options.headers['x-goog-api-key'], 'test-key');
        return {
          ok: true,
          json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(q) }] } }] }),
        };
      },
    );
    assert.deepEqual(result, q);
  } finally {
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL;
    else process.env.GEMINI_MODEL = previousModel;
  }
});

test('enabled Gemini is selected for an authenticated user', async () => {
  const previousEnv = {
    enabled: process.env.ENABLE_GEMINI,
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  };
  const previousFetch = globalThis.fetch;
  process.env.ENABLE_GEMINI = 'true';
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GEMINI_MODEL = 'gemini-3.8-flash';
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(parseKeywords('Find products')) }] } }] }),
  });

  try {
    const result = await interpret(
      { text: 'Find products', locale: 'en-LK' },
      { userId: 'gemini-provider-test-user' },
    );
    assert.equal(result.source, 'gemini');
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries({
      ENABLE_GEMINI: previousEnv.enabled,
      GEMINI_API_KEY: previousEnv.key,
      GEMINI_MODEL: previousEnv.model,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('demo mode allows Gemini without a login token', async () => {
  const previousEnv = {
    enabled: process.env.ENABLE_GEMINI,
    allowUnauthenticated: process.env.ALLOW_UNAUTHENTICATED_AI,
    key: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL,
  };
  const previousFetch = globalThis.fetch;
  process.env.ENABLE_GEMINI = 'true';
  process.env.ALLOW_UNAUTHENTICATED_AI = 'true';
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.GEMINI_MODEL = 'gemini-3.8-flash';
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(parseKeywords('Find products')) }] } }] }),
  });

  try {
    const result = await interpret(
      { text: 'Find products', locale: 'en-LK' },
      { clientId: 'demo-client' },
    );
    assert.equal(result.source, 'gemini');
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries({
      ENABLE_GEMINI: previousEnv.enabled,
      ALLOW_UNAUTHENTICATED_AI: previousEnv.allowUnauthenticated,
      GEMINI_API_KEY: previousEnv.key,
      GEMINI_MODEL: previousEnv.model,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

