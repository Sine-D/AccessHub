import { emptyQuery, validateInput } from './contracts.ts';
import type { Feature, SearchQuery } from './contracts.ts';
const featureTerms: Record<Feature, RegExp> = {
 wheelchair_ramp:/wheelchair(?:[- ]accessible)?|ramps?|රෝද පුටු|சக்கர நாற்காலி/giu,
 step_free:/step[- ]free(?: entrance| campus)?/giu,
 accessible_parking:/accessible parking/giu,accessible_restroom:/accessible (?:restrooms?|toilets?)/giu,
 braille:/braille(?: documents?| dots)?|බ්‍රේල්|பிரெய்லி/giu,
 sign_language:/sign[- ]language(?: support| staff)?/giu,
 tactile_paving:/tactile paving/giu,elevator:/elevators?|lifts?/giu,high_contrast:/high[- ]contrast/giu
};
export function matchesFeatures(labels: string[], required: readonly Feature[]): boolean {
 const aliases:Record<Feature,RegExp>={
 wheelchair_ramp:/^(?:wheelchair ramp|ramp|wheelchair accessible entrance & ramp)$/i,
 step_free:/^step[- ]free(?: entrance| campus)?$/i,
 accessible_parking:/^accessible parking$/i,accessible_restroom:/^accessible (?:restroom|toilet)$/i,
 braille:/^braille(?: documents| dots)?$/i,sign_language:/^sign[- ]language(?: support| staff)?$/i,
 tactile_paving:/^tactile paving$/i,elevator:/^(?:elevator|lift)$/i,high_contrast:/^high[- ]contrast(?: yellow)?$/i
 };
 return required.every(f => labels.some(label => label===f || aliases[f].test(label.trim())));
}
export function parseKeywords(text: string, locale='en-LK'): SearchQuery {
 let input=validateInput({text,locale}).text.toLowerCase();
 const q=emptyQuery();
 if(/\b(?:not|without|exclude|except)\b|නැති|இல்லாத/u.test(input)) {
  q.clarification='Exclusions need clarification. Please specify the features you require.';return q;
 }
 const domains=[
  {intent:'places' as const,re:/\b(?:places?|caf[eé]s?|hospitals?|restaurants?|ramps?)\b|ස්ථාන|இடங்கள்/iu},
  {intent:'products' as const,re:/\b(?:products?|marketplace|shirts?|clocks?|crafts?|home goods|food|apparel)\b|භාණ්ඩ|பொருட்கள்/iu},
  {intent:'jobs' as const,re:/\bjobs?\b|රැකියා|வேலை/iu},
 ].filter(d=>d.re.test(input));
 if(domains.length!==1) {q.clarification='Do you want places, products or jobs? Please choose one.';return q;}
 q.intent=domains[0].intent;
 for(const [feature,re] of Object.entries(featureTerms)) {
   re.lastIndex=0;
   if(re.test(input)) {q.features.push(feature as Feature);re.lastIndex=0;input=input.replace(re,' ');}
 }
 const priceText=input.replace(/(\d),(?=\d{3}\b)/g,'$1');
 if(/(?:under|below|over|above|between)\s*(?:lkr|rs\.?)?\s*-\d/.test(priceText)) {q.clarification='Use a non-negative price.';return q;}
 const range=priceText.match(/between\s*(?:lkr|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(?:lkr|rs\.?)?\s*(\d+(?:\.\d+)?)/);
 const max=priceText.match(/(?:under|below|up to|max(?:imum)?)\s*(?:lkr|rs\.?)?\s*(\d+(?:\.\d+)?)/);
 const min=priceText.match(/(?:over|above|min(?:imum)?)\s*(?:lkr|rs\.?)?\s*(\d+(?:\.\d+)?)/);
 q.minPrice=range ? Number(range[1]) : min ? Number(min[1]) : null;
 q.maxPrice=range ? Number(range[2]) : max ? Number(max[1]) : null;
 input=priceText;
 for(const m of [range,max,min]) if(m) input=input.replace(m[0],' ');
 if((q.minPrice!==null && q.maxPrice!==null && q.minPrice>q.maxPrice) || (q.maxPrice ?? 0)>100000000 || (q.minPrice ?? 0)>100000000) {q.clarification='Please give a valid minimum and maximum price.';return q;}
 if(q.intent!=='products' && (q.minPrice!==null || q.maxPrice!==null)) {q.clarification='Price filtering is available for products. Do you want to search products?';return q;}
 const location=input.match(/\b(?:near|in|around)\s+([\p{L}\p{N}][\p{L}\p{N}\s-]{0,79})/u);
 if(location) {q.location=location[1].trim();input=input.replace(location[0],' ');}
 if(q.location && /^(?:me|my location|here)$/.test(q.location)) {q.clarification='Use the map’s My location button to allow location access, then search nearby.';return q;}
 const categories: [string,RegExp][] = q.intent==='places'
 ? [['cafe',/caf[eé]s?/iu],['hospital',/hospitals?/iu],['restaurant',/restaurants?/iu]]
 : q.intent==='products' ? [['Crafts & Decor',/crafts?(?: & decor)?/iu],['Home Goods',/home goods/iu],['Food & Organic',/food(?: & organic)?/iu],['Apparel & Adaptive',/apparel(?: & adaptive)?/iu]] : [];
 for(const [name,re] of categories) if(re.test(input)) {q.category=name;input=input.replace(re,' ');break;}
 q.keywords=input.replace(/\b(?:find|show|search|for|please|me|the|all|accessible|products?|places?|jobs?|marketplace)\b/giu,' ').replace(/[“”"!?.,]/g,' ').replace(/\s+/g,' ').trim();
 q.needsClarification=false;q.clarification=null;
 return q;
}
