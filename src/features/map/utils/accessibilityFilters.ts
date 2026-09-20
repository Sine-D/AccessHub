import { FEATURES } from '../../../core/search/contracts.ts';
import type { Feature } from '../../../core/search/contracts.ts';
import { matchesFeatures } from '../../../core/search/parser.ts';
export const featureLabels:Record<Feature,string>={
 wheelchair_ramp:'Wheelchair ramp',step_free:'Step-free entrance',accessible_parking:'Accessible parking',
 accessible_restroom:'Accessible restroom',braille:'Braille',sign_language:'Sign-language support',
 tactile_paving:'Tactile paving',elevator:'Elevator',high_contrast:'High contrast'
};
export {FEATURES,matchesFeatures};
export function filterPlaces<T extends {accessibilityFeatures:string[]}>(places:T[],features:readonly Feature[]):T[] {
 return places.filter(p=>matchesFeatures(p.accessibilityFeatures,features));
}
export function parseFeatureParams(params:URLSearchParams):Feature[] {
 const features=params.getAll('feature');
 if(features.length>FEATURES.length || features.some(f=>!FEATURES.includes(f as Feature))) throw new Error('Invalid accessibility filter.');
 return [...new Set(features)] as Feature[];
}

