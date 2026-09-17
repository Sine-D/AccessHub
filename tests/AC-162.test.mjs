import test from 'node:test';import assert from 'node:assert/strict';
import {parseKeywords} from '../src/core/search/parser.ts';
import {matchesSearch} from '../src/core/search/matchSearch.ts';
import {interpret} from '../server/interpret.mjs';
import {searchSchema,interpretOpenAI} from '../server/openai.mjs';
test('Kandy wheelchair café extracts all entities',()=>{const q=parseKeywords('Find wheelchair-accessible cafés near Kandy');assert.equal(q.intent,'places');assert.equal(q.category,'cafe');assert.equal(q.location,'kandy');assert.deepEqual(q.features,['wheelchair_ramp']);assert.equal(q.keywords,'');});
test('price range and product feature',()=>{const q=parseKeywords('Find Braille products between 2,000 and 7,000');assert.equal(q.minPrice,2000);assert.equal(q.maxPrice,7000);assert.deepEqual(q.features,['braille']);});
test('actual records obey price bounds',()=>{const q=parseKeywords('Find products under 5000');assert.equal(matchesSearch({title:'A',price:4500},q),true);assert.equal(matchesSearch({title:'B',price:6500},q),false);});
test('disabled AI uses keyword source',async()=>{const r=await interpret({text:'Find places in Kandy',locale:'en-LK'});assert.equal(r.source,'keyword');});
test('strict schema and mocked structured response',async()=>{process.env.OPENAI_MODEL='test-model';assert.equal(searchSchema.additionalProperties,false);const q=parseKeywords('Find products');const r=await interpretOpenAI({text:'Find products',locale:'en-LK'},async()=>({ok:true,json:async()=>({status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify(q)}]}]})}));assert.deepEqual(r,q);});

