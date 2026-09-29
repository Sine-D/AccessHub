import type { SearchQuery } from '../../../core/search/contracts.ts';
import type { ScreenView } from '../../../core/context/AppStateContext';

/**
 * Place/location queries belong in the directory because it owns the map,
 * distance ordering and accessibility filters. Product and job queries use
 * the common results screen.
 */
export function routeForSearchQuery(query: SearchQuery): ScreenView {
  return query.intent === 'places' ? 'map' : 'search_results';
}

