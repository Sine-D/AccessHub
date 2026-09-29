import React from 'react';

interface SearchResultsStatusProps {
  count: number;
  error: string;
  loading: boolean;
}

export function searchStatusMessage({ count, error, loading }: SearchResultsStatusProps): string {
  if (loading) return 'Loading search results…';
  if (error) return error;
  if (count === 0) return 'No matching results.';
  return `${count} matching ${count === 1 ? 'result' : 'results'}.`;
}

export function SearchResultsStatus(props: SearchResultsStatusProps) {
  const message = searchStatusMessage(props);
  return (
    <p
      aria-atomic="true"
      aria-live={props.error ? 'assertive' : 'polite'}
      className="rounded-xl bg-slate-100 p-3 text-sm font-bold dark:bg-slate-900"
      role={props.error ? 'alert' : 'status'}
    >
      {message}
    </p>
  );
}

