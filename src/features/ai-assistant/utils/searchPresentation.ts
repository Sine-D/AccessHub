import type { SearchQuery } from '../../../core/search/contracts.ts';
import { featureLabels } from '../../map/utils/accessibilityFilters.ts';

export interface SearchFilterChip {
  id: string;
  label: string;
}

export function presentSearchFilters(query: SearchQuery): SearchFilterChip[] {
  const chips: SearchFilterChip[] = [];
  chips.push({ id: 'intent', label: `Type: ${query.intent}` });
  if (query.category) chips.push({ id: 'category', label: `Category: ${query.category}` });
  if (query.location) chips.push({ id: 'location', label: `Location: ${query.location}` });
  if (query.keywords.trim()) chips.push({ id: 'keywords', label: `Keywords: ${query.keywords.trim()}` });
  if (query.minPrice !== null) chips.push({ id: 'min-price', label: `Minimum: LKR ${query.minPrice.toLocaleString()}` });
  if (query.maxPrice !== null) chips.push({ id: 'max-price', label: `Maximum: LKR ${query.maxPrice.toLocaleString()}` });
  query.features.forEach((feature) => {
    chips.push({ id: `feature-${feature}`, label: `Needs: ${featureLabels[feature]}` });
  });
  return chips;
}

