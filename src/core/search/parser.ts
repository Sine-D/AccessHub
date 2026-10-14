import { emptyQuery, validateInput } from './contracts.ts';
import type { Feature, SearchQuery } from './contracts.ts';

const commonCorrections: Array<[RegExp, string]> = [
  [/\b(?:resturant|restaraunt|resteraunt|restaurent)s?\b/giu, 'restaurant'],
  [/\b(?:wheelhair|wheelchiar|weelchair|wheel chair)s?\b/giu, 'wheelchair'],
  [/\b(?:caffee|cofee|coffee shop)s?\b/giu, 'cafe'],
  [/\bhospitel?s?\b/giu, 'hospital'],
  [/\bmarkeplace\b/giu, 'marketplace'],
  [/\bproduts?\b/giu, 'products'],
  [/\bith\b/giu, 'with'],
];

const sriLankanLocations: Array<[string, RegExp]> = [
  ['colombo', /කොළඹ/giu],
  ['kandy', /මහනුවර|නුවර/giu],
  ['galle', /ගාල්ල/giu],
  ['jaffna', /යාපනය/giu],
  ['matara', /මාතර/giu],
  ['kurunegala', /කුරුණෑගල/giu],
  ['negombo', /මීගමුව/giu],
  ['anuradhapura', /අනුරාධපුර(?:ය)?/giu],
  ['polonnaruwa', /පොළොන්නරුව/giu],
  ['ratnapura', /රත්නපුර(?:ය)?/giu],
  ['badulla', /බදුල්ල/giu],
  ['batticaloa', /මඩකලපුව/giu],
  ['trincomalee', /ත්‍රිකුණාමල(?:ය)?/giu],
];

const featureTerms: Record<Feature, RegExp> = {
  wheelchair_ramp: /wheelchair(?:[- ]accessible)?(?: entrances?)?|ramps?|රෝද\s*පුටු(?:වට|ව\s*සඳහා|\s*සඳහා)?(?:\s*(?:පිවිසුමක්?|බෑවුමක්?|රැම්ප්(?: එකක්)?))?|වීල්චෙයාර්(?:\s*(?:බෑවුමක්?|රැම්ප්(?: එකක්)?))?|බෑවුමක්?|රැම්ප්(?: එකක්)?|சக்கர நாற்காலி/giu,
  step_free: /step[- ]free(?: entrance| campus)?|පඩි(?:පෙළ)?\s*රහිත/giu,
  accessible_parking: /accessible parking|ප්‍රවේශ පහසුකම් සහිත වාහන නැවැත්වීම|ආබාධිත වාහන නැවැත්වීම/giu,
  accessible_restroom: /accessible (?:restrooms?|toilets?)|ප්‍රවේශ පහසුකම් සහිත වැසිකිළි|ආබාධිත වැසිකිළි/giu,
  braille: /braille(?: documents?| dots)?|බ්‍රේල්|பிரெய்லி/giu,
  sign_language: /sign[- ]language(?: support| staff)?|සංඥා භාෂා(?: සහාය)?/giu,
  tactile_paving: /tactile paving|ස්පර්ශක මාර්ග|ස්පර්ශ මංතීරු/giu,
  elevator: /elevators?|lifts?|සෝපාන(?:ය)?|ලිෆ්ට්/giu,
  high_contrast: /high[- ]contrast|ඉහළ වර්ණ වෙනස/giu,
};

const domainTerms = [
  {
    intent: 'places' as const,
    re: /\b(?:places?|caf[eé]s?|hospitals?|restaurants?|ramps?)\b|ස්ථාන|අවන්හල්?|අවන්හලක්|ආපන\s*ශාලා(?:වක්)?|කැෆේ|රෝහල්?|රෝහලක්|இடங்கள்/iu,
  },
  {
    intent: 'products' as const,
    re: /\b(?:products?|marketplace|shirts?|clocks?|crafts?|home goods|food|apparel)\b|භාණ්ඩ|නිෂ්පාදන|වෙළඳපොළ|பொருட்கள்/iu,
  },
  { intent: 'jobs' as const, re: /\bjobs?\b|රැකියා|රැකියාවක්|வேலை/iu },
];

const placeCategories: Array<[string, RegExp]> = [
  ['cafe', /caf[eé]s?|කැෆේ/iu],
  ['hospital', /hospitals?|රෝහල්?|රෝහලක්/iu],
  ['restaurant', /restaurants?|අවන්හලක්|අවන්හල්|අවන්හල|ආපන\s*ශාලා(?:වක්)?/iu],
];

const productCategories: Array<[string, RegExp]> = [
  ['Crafts & Decor', /crafts?(?: & decor)?|අත්කම්/iu],
  ['Home Goods', /home goods|ගෘහ භාණ්ඩ/iu],
  ['Food & Organic', /food(?: & organic)?|ආහාර/iu],
  ['Apparel & Adaptive', /apparel(?: & adaptive)?|ඇඳුම්/iu],
];

function normalizeCommonMistakes(value: string): string {
  return commonCorrections.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}

function extractKnownLocation(input: string): { input: string; location: string | null } {
  for (const [location, pattern] of sriLankanLocations) {
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      pattern.lastIndex = 0;
      return { input: input.replace(pattern, ' '), location };
    }
  }
  return { input, location: null };
}

export function matchesFeatures(labels: string[], required: readonly Feature[]): boolean {
  const aliases: Record<Feature, RegExp> = {
    wheelchair_ramp: /^(?:wheelchair ramp|ramp|wheelchair accessible entrance & ramp)$/i,
    step_free: /^step[- ]free(?: entrance| campus)?$/i,
    accessible_parking: /^accessible parking$/i,
    accessible_restroom: /^accessible (?:restroom|toilet)$/i,
    braille: /^braille(?: documents| dots)?$/i,
    sign_language: /^sign[- ]language(?: support| staff)?$/i,
    tactile_paving: /^tactile paving$/i,
    elevator: /^(?:elevator|lift)$/i,
    high_contrast: /^high[- ]contrast(?: yellow)?$/i,
  };
  return required.every((feature) =>
    labels.some((label) => label === feature || aliases[feature].test(label.trim())),
  );
}

export function parseKeywords(text: string, locale = 'en-LK'): SearchQuery {
  let input = normalizeCommonMistakes(validateInput({ text, locale }).text.toLowerCase());
  const query = emptyQuery();

  if (/\b(?:not|without|exclude|except)\b|නැති|නොමැති|இல்லாத/u.test(input)) {
    query.clarification = locale === 'si-LK'
      ? 'ඔබට අවශ්‍ය ප්‍රවේශ පහසුකම් පැහැදිලිව සඳහන් කරන්න.'
      : 'Exclusions need clarification. Please specify the features you require.';
    return query;
  }

  const domains = domainTerms.filter((domain) => domain.re.test(input));
  if (domains.length !== 1) {
    query.clarification = locale === 'si-LK'
      ? 'ඔබට ස්ථාන, භාණ්ඩ හෝ රැකියා සෙවීමට අවශ්‍යද? එකක් තෝරන්න.'
      : 'Do you want places, products or jobs? Please choose one.';
    return query;
  }
  query.intent = domains[0].intent;

  for (const [feature, pattern] of Object.entries(featureTerms)) {
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      query.features.push(feature as Feature);
      pattern.lastIndex = 0;
      input = input.replace(pattern, ' ');
    }
  }

  const priceText = input.replace(/(\d),(?=\d{3}\b)/g, '$1');
  if (/(?:under|below|over|above|between)\s*(?:lkr|rs\.?)?\s*-\d/.test(priceText)) {
    query.clarification = 'Use a non-negative price.';
    return query;
  }

  const range = priceText.match(/between\s*(?:lkr|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:and|to|-)\s*(?:lkr|rs\.?)?\s*(\d+(?:\.\d+)?)/);
  const max = priceText.match(/(?:under|below|up to|max(?:imum)?)\s*(?:lkr|rs\.?)?\s*(\d+(?:\.\d+)?)|(?:රුපියල්|රු\.?|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:ට|කට)?\s*අඩු/iu);
  const min = priceText.match(/(?:over|above|min(?:imum)?)\s*(?:lkr|rs\.?)?\s*(\d+(?:\.\d+)?)|(?:රුපියල්|රු\.?|rs\.?)?\s*(\d+(?:\.\d+)?)\s*(?:ට|කට)?\s*වැඩි/iu);
  query.minPrice = range ? Number(range[1]) : min ? Number(min[1] ?? min[2]) : null;
  query.maxPrice = range ? Number(range[2]) : max ? Number(max[1] ?? max[2]) : null;
  input = priceText;
  for (const match of [range, max, min]) if (match) input = input.replace(match[0], ' ');

  if (
    (query.minPrice !== null && query.maxPrice !== null && query.minPrice > query.maxPrice) ||
    (query.maxPrice ?? 0) > 100000000 ||
    (query.minPrice ?? 0) > 100000000
  ) {
    query.clarification = 'Please give a valid minimum and maximum price.';
    return query;
  }
  if (query.intent !== 'products' && (query.minPrice !== null || query.maxPrice !== null)) {
    query.clarification = 'Price filtering is available for products. Do you want to search products?';
    return query;
  }

  const knownLocation = extractKnownLocation(input);
  input = knownLocation.input;
  query.location = knownLocation.location;

  if (!query.location) {
    const locationMatch = input.match(/\b(?:near|in|around)\s+([\p{L}\p{N}][\p{L}\p{N}\s-]{0,79})/u);
    if (locationMatch) {
      query.location = locationMatch[1].trim();
      input = input.replace(locationMatch[0], ' ');
    }
  }
  if (query.location && /^(?:me|my location|here)$/.test(query.location)) {
    query.clarification = 'Use the map’s My location button to allow location access, then search nearby.';
    return query;
  }

  const categories = query.intent === 'places'
    ? placeCategories
    : query.intent === 'products'
      ? productCategories
      : [];
  for (const [name, pattern] of categories) {
    if (pattern.test(input)) {
      query.category = name;
      input = input.replace(pattern, ' ');
      break;
    }
  }

  input = input
    .replace(/\b(?:a|an|any|can|could|would|you|find|show|search|locate|get|give|want|looking|for|please|me|the|all|accessible|with|that|which|has|have|having|products?|places?|jobs?|marketplace)\b/giu, ' ')
    .replace(/මට|අපට|කරුණාකර|පුළුවන්ද|හැකිද|සොයන්න|හොයන්න|පෙන්වන්න|අවශ්‍යයි|සහිත|ඇති|තියෙන|ළඟ|අසල|ස්ථාන|භාණ්ඩ|නිෂ්පාදන|වෙළඳපොළ|රැකියා|රැකියාවක්/giu, ' ')
    .replace(/[“”"!?.,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  query.keywords = input;
  query.needsClarification = false;
  query.clarification = null;
  return query;
}
