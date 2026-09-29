import React from 'react';
import { presentPlaceFeature } from '../utils/placeFeaturePresentation.ts';

export function AccessibilityFeatureList({ features }: { features: string[] }) {
  if (features.length === 0) {
    return (
      <p className="rounded-xl bg-slate-100 p-3 text-sm dark:bg-slate-800">
        No accessibility features have been published for this place.
      </p>
    );
  }

  return (
    <section aria-labelledby="place-features-heading">
      <h3 id="place-features-heading" className="text-base font-extrabold">
        Accessibility features
      </h3>
      <ul className="mt-2 space-y-2">
        {features.map((feature) => {
          const item = presentPlaceFeature(feature);
          return (
            <li key={item.id} className="rounded-xl border border-teal-200 bg-teal-50 p-3 dark:border-teal-800 dark:bg-teal-950/40">
              <span className="block text-sm font-extrabold text-teal-950 dark:text-teal-100">
                {item.label}
              </span>
              <span className="mt-1 block text-xs text-teal-900 dark:text-teal-200">
                {item.description}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

