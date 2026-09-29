import { FEATURES, featureLabels } from './accessibilityFilters.ts';
import type { Feature } from '../../../core/search/contracts.ts';

const descriptions: Record<Feature, string> = {
  wheelchair_ramp: 'A wheelchair ramp is reported at the entrance.',
  step_free: 'A route without steps is reported.',
  accessible_parking: 'Designated accessible parking is reported.',
  accessible_restroom: 'An accessible restroom is reported.',
  braille: 'Braille information or documents are reported.',
  sign_language: 'Sign-language support is reported.',
  tactile_paving: 'Tactile paving is reported.',
  elevator: 'An accessible lift or elevator is reported.',
  high_contrast: 'High-contrast information is reported.',
};

const aliases: Array<[Feature, RegExp]> = [
  ['wheelchair_ramp', /wheelchair.*ramp|^ramp$/i],
  ['step_free', /step[- ]free/i],
  ['accessible_parking', /accessible parking/i],
  ['accessible_restroom', /accessible (?:restroom|toilet)/i],
  ['braille', /braille/i],
  ['sign_language', /sign[- ]language/i],
  ['tactile_paving', /tactile paving/i],
  ['elevator', /elevator|lift/i],
  ['high_contrast', /high[- ]contrast/i],
];

export interface PresentedPlaceFeature {
  description: string;
  id: string;
  label: string;
}

export function presentPlaceFeature(value: string): PresentedPlaceFeature {
  const canonical = FEATURES.includes(value as Feature)
    ? (value as Feature)
    : aliases.find(([, pattern]) => pattern.test(value.trim()))?.[0];
  if (canonical) {
    return {
      id: canonical,
      label: featureLabels[canonical],
      description: descriptions[canonical],
    };
  }
  const label = value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    id: value,
    label,
    description: 'Accessibility information reported by the place or community.',
  };
}

