import React from 'react';
import type { CommunityVerificationSummary } from '../types/placeDetails';

export function CommunityVerificationCard({
  verification,
}: {
  verification: CommunityVerificationSummary | null;
}) {
  if (!verification) {
    return (
      <section aria-labelledby="community-verification-heading" className="rounded-xl border border-slate-300 p-3 dark:border-slate-700">
        <h3 id="community-verification-heading" className="font-extrabold">
          Community verification
        </h3>
        <p className="mt-1 text-sm">No community verification summary is available.</p>
      </section>
    );
  }

  return (
    <section aria-labelledby="community-verification-heading" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
      <h3 id="community-verification-heading" className="font-extrabold text-emerald-950 dark:text-emerald-100">
        Community verification
      </h3>
      <dl className="mt-2 grid gap-2 text-sm">
        <div>
          <dt className="font-bold">Community rating</dt>
          <dd>
            {verification.rating === null
              ? 'Not yet rated'
              : `${verification.rating.toFixed(1)} out of 5 from ${verification.reviewCount} ${verification.reviewCount === 1 ? 'review' : 'reviews'}`}
          </dd>
        </div>
        <div>
          <dt className="font-bold">Verification badge</dt>
          <dd>{verification.badge || 'No badge awarded'}</dd>
        </div>
      </dl>
    </section>
  );
}

