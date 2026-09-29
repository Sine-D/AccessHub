import React from 'react';
import type { SearchQuery } from '../../../core/search/contracts.ts';
import { presentSearchFilters } from '../utils/searchPresentation';

export function InterpretedSearchFilters({ query }: { query: SearchQuery }) {
  const chips = presentSearchFilters(query);
  return (
    <section
      aria-labelledby="interpreted-search-heading"
      className="rounded-2xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/40"
    >
      <h2 id="interpreted-search-heading" className="text-sm font-extrabold text-blue-950 dark:text-blue-100">
        Interpreted search filters
      </h2>
      <ul className="mt-2 flex flex-wrap gap-2" aria-label="Applied search filters">
        {chips.map((chip) => (
          <li key={chip.id} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-blue-800 shadow-sm dark:bg-slate-900 dark:text-blue-200">
            {chip.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
