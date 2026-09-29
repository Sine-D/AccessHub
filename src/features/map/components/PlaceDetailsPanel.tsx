import React from 'react';
import type { MapPin } from '../../../core/types/models';

interface PlaceDetailsPanelProps {
  onClose: () => void;
  place: MapPin;
}

export function PlaceDetailsPanel({ onClose, place }: PlaceDetailsPanelProps) {
  return (
    <section
      id="place-details-panel"
      aria-labelledby="place-details-heading"
      className="rounded-3xl border border-blue-200 bg-white p-4 shadow-lg dark:border-blue-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-blue-600 dark:text-blue-300">
            Accessible place details
          </p>
          <h2 id="place-details-heading" className="mt-1 text-lg font-extrabold text-slate-950 dark:text-white">
            {place.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700"
          aria-label={`Close details for ${place.title}`}
        >
          Close
        </button>
      </div>

      <img
        alt=""
        className="mt-3 h-40 w-full rounded-2xl object-cover"
        src={place.image}
      />

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="font-extrabold">Address</dt>
          <dd>{place.address}</dd>
        </div>
        <div>
          <dt className="font-extrabold">Place type</dt>
          <dd className="capitalize">{place.type}</dd>
        </div>
        <div>
          <dt className="font-extrabold">Distance</dt>
          <dd>{place.distance}</dd>
        </div>
      </dl>
    </section>
  );
}
