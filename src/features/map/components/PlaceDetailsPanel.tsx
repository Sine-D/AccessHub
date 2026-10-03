import React, { useState, useEffect, useRef } from 'react';
import type { MapPin } from '../../../core/types/models';
import type { PlaceDetails } from '../types/placeDetails';
import { AccessibilityFeatureList } from './AccessibilityFeatureList';
import { AccessibleDirectionsLink } from './AccessibleDirectionsLink';
import { CommunityVerificationCard } from './CommunityVerificationCard';
import { StepFreeRouteModal } from './StepFreeRouteModal';

interface PlaceDetailsPanelProps {
  details: PlaceDetails | null;
  error: string;
  loading: boolean;
  onClose: () => void;
  onRetry: () => void;
  place: MapPin;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
}

export function PlaceDetailsPanel({
  details,
  error,
  loading,
  onClose,
  onRetry,
  place,
  returnFocusRef,
}: PlaceDetailsPanelProps) {
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: false });
  }, [place.id]);

  const closeDetails = () => {
    onClose();
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  return (
    <>
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
            <h2
              ref={headingRef}
              id="place-details-heading"
              tabIndex={-1}
              className="mt-1 text-lg font-extrabold text-slate-950 focus:outline-none dark:text-white"
            >
              {place.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={closeDetails}
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

        {loading && (
          <p className="mt-4 rounded-xl bg-slate-100 p-3 text-sm font-bold dark:bg-slate-800" role="status">
            Loading place details…
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100" role="alert">
            <p>{error}</p>
            <button type="button" className="mt-2 min-h-11 rounded-lg border px-3 font-bold" onClick={onRetry}>
              Try again
            </button>
          </div>
        )}

        {details && <p className="mt-4 text-sm leading-relaxed">{details.description}</p>}

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
          {!!details?.openingHours.length && (
            <div>
              <dt className="font-extrabold">Opening hours</dt>
              <dd>{details.openingHours.join(' · ')}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5">
          <AccessibilityFeatureList features={place.accessibilityFeatures} />
        </div>

        {/* AC-230: Step-Free Route Preview & Tactile Route Suggestions */}
        <div className="mt-5 space-y-3">
          <button
            type="button"
            onClick={() => setRouteModalOpen(true)}
            className="flex w-full min-h-12 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 px-4 py-2.5 text-sm font-extrabold text-white shadow-md transition-all hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <span>🗺️ Step-Free & Tactile Route Preview</span>
          </button>

          <AccessibleDirectionsLink place={place} />
        </div>

        {!loading && !error && (
          <div className="mt-5">
            <CommunityVerificationCard verification={details?.verification ?? null} />
          </div>
        )}
      </section>

      <StepFreeRouteModal
        place={place}
        isOpen={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
      />
    </>
  );
}
