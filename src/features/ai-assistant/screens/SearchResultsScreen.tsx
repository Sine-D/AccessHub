import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { mockProducts, mockJobs } from '../../../mock/data';
import { getAccessiblePlaces } from '../../../services/placesService';
import type { MapPin } from '../../../core/types/models';
import { matchesSearch } from '../../../core/search/matchSearch.ts';
import { matchesFeatures } from '../../../core/search/parser.ts';
import { InterpretedSearchFilters } from '../components/InterpretedSearchFilters';
import { SearchResultsStatus } from '../components/SearchResultsStatus';

export const SearchResultsScreen: React.FC = () => {
  const { searchQuery, setActiveScreen, setSelectedProduct } = useAppState();
  const [places, setPlaces] = useState<MapPin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (searchQuery?.intent !== 'places') return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getAccessiblePlaces(controller.signal, searchQuery.features)
      .then((records) => {
        if (!controller.signal.aborted) setPlaces(records);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Places could not load. Please try again.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [searchQuery]);

  const results = useMemo(() => {
    if (!searchQuery) return [];
    const records =
      searchQuery.intent === 'places'
        ? places
        : searchQuery.intent === 'products'
          ? mockProducts
          : mockJobs.map((job) => ({
              ...job,
              accessibilityFeatures: job.accessibilityBadges,
            }));
    return records.filter(
      (record) =>
        matchesSearch(record, searchQuery) &&
        matchesFeatures(record.accessibilityFeatures || [], searchQuery.features),
    );
  }, [searchQuery, places]);

  return (
    <div className="flex h-full flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <TopHeader title="Search results" />
      <main className="flex-1 space-y-4 overflow-y-auto p-4">
        <h1 ref={headingRef} tabIndex={-1} className="text-xl font-extrabold focus:outline-none">
          Search results
        </h1>

        {searchQuery ? (
          <InterpretedSearchFilters query={searchQuery} />
        ) : (
          <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-3">
            No active search. Open the AI assistant and enter a query.
          </p>
        )}

        <SearchResultsStatus count={results.length} error={error} loading={loading} />

        {!loading && !error && results.length === 0 && searchQuery && (
          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="font-extrabold">No matching results</h2>
            <p className="mt-1 text-sm">
              Try a different location, a higher price limit, or fewer accessibility requirements.
            </p>
          </div>
        )}

        <ul className="space-y-3" aria-label="Search results">
          {results.map((record) => (
            <li key={record.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
              <h2 className="font-extrabold">{record.title}</h2>
              {'address' in record && <p className="text-sm">{String(record.address)}</p>}
              {'price' in record && <p className="text-sm">LKR {Number(record.price).toLocaleString()}</p>}
              {!!record.accessibilityFeatures?.length && (
                <p className="mt-2 text-xs">Accessibility: {record.accessibilityFeatures.join(', ')}</p>
              )}
              <button
                className="mt-3 min-h-11 rounded-xl border border-blue-600 px-4 text-sm font-bold text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-blue-300"
                type="button"
                onClick={() => {
                  if (searchQuery?.intent === 'products') {
                    const product = mockProducts.find((item) => item.id === record.id);
                    if (product) setSelectedProduct(product);
                    setActiveScreen('product_detail');
                    return;
                  }
                  setActiveScreen(searchQuery?.intent === 'places' ? 'map' : 'jobs');
                }}
              >
                Open {searchQuery?.intent === 'places' ? 'filtered directory' : 'details'}
              </button>
            </li>
          ))}
        </ul>
      </main>
      <BottomNav />
    </div>
  );
};
