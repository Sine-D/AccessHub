import test from 'node:test';import assert from 'node:assert/strict';
import {filterPlaces,parseFeatureParams,FEATURES} from '../src/features/map/utils/accessibilityFilters.ts';
import {queryPlaces} from '../server/places.mjs';
const records=[{id:'a',accessibilityFeatures:['Wheelchair ramp','Accessible parking']},{id:'b',accessibilityFeatures:['Braille documents','Accessible restroom']},{id:'c',accessibilityFeatures:[]}];
test('every individual canonical feature works',()=>{for(const feature of FEATURES)assert.equal(filterPlaces([{accessibilityFeatures:[feature]}],[feature]).length,1);});
test('combined AND matching, zero results and reset',()=>{assert.deepEqual(filterPlaces(records,['wheelchair_ramp','accessible_parking']).map(p=>p.id),['a']);assert.equal(filterPlaces(records,['wheelchair_ramp','braille']).length,0);assert.equal(filterPlaces(records,[]).length,3);assert.equal(records.length,3);});
test('unknown facilities excluded and malformed backend filter rejected',()=>{assert.equal(filterPlaces([records[2]],['wheelchair_ramp']).length,0);assert.throws(()=>parseFeatureParams(new URLSearchParams('feature=unknown')));});
test('negative or unrelated descriptions are not positive features',()=>{assert.equal(filterPlaces([{accessibilityFeatures:['No wheelchair ramp','Wheelchair Delivered']}],['wheelchair_ramp']).length,0);});
test('backend uses safe canonical containment and maps DB columns',async()=>{
 process.env.SUPABASE_URL='https://example.supabase.co';process.env.SUPABASE_ANON_KEY='test';
 const r=await queryPlaces(new URLSearchParams('feature=braille'),async url=>{assert.equal(url.searchParams.get('accessibility_features'),'cs.{braille}');assert.equal(url.searchParams.get('published'),'eq.true');return {ok:true,json:async()=>[{id:'a',accessibility_features:['braille'],accessibility_rating:4}]};});
 assert.deepEqual(r[0].accessibilityFeatures,['braille']);
});
