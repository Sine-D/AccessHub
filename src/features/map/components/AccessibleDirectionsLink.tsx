import React from 'react';
import type { MapPin } from '../../../core/types/models';
import { buildDirectionsUrl } from '../utils/directions';

export function AccessibleDirectionsLink({ place }: { place: MapPin }) {
  const href = buildDirectionsUrl(place);
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/40">
      <a
        className="inline-flex min-h-11 items-center rounded-xl bg-blue-700 px-4 py-2 text-sm font-extrabold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        href={href}
        rel="noreferrer noopener"
        target="_blank"
        aria-label={`Open directions to ${place.title} in Google Maps in a new tab`}
      >
        Open directions
      </a>
      <p className="mt-2 text-xs text-blue-950 dark:text-blue-100">
        Opens Google Maps in a new tab. Confirm that the suggested route meets your accessibility needs before travelling.
      </p>
    </div>
  );
}

