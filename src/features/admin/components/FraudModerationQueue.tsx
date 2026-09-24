import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { ModerationItem, PaginatedModerationResponse } from '../../../types/fraudModeration';
import {
  fetchModerationQueue,
  approveModeratedContent,
  removeModeratedContent,
  subscribeToRemovalUpdates,
} from '../../../services/fraudModerationService';

export const FraudModerationQueue: React.FC = () => {
  const { userRole } = useAppState();
  const { speakText } = useAccessibility();

  const [paginatedData, setPaginatedData] = useState<PaginatedModerationResponse | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('flagged');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(3); // AC-256: pagination page size
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Content removal confirmation modal target
  const [removalTarget, setRemovalTarget] = useState<ModerationItem | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchModerationQueue(userRole || 'admin', {
        page,
        pageSize,
        typeFilter,
        statusFilter,
      });
      setPaginatedData(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch fraud moderation queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userRole, page, typeFilter, statusFilter]);

  // AC-263: Real-time removal listener hook
  useEffect(() => {
    const unsubscribe = subscribeToRemovalUpdates((removedId) => {
      speakText('Realtime update: Moderated content removed from queue.');
      loadData();
    });
    return () => unsubscribe();
  }, []);

  const handleApprove = async (item: ModerationItem) => {
    setActionLoading(true);
    setError(null);
    try {
      await approveModeratedContent(item.contentId, userRole || 'admin');
      speakText(`Approved content ${item.title}. Flag dismissed.`);
      setSuccessMessage(`Approved "${item.title}". Flag has been dismissed.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve content.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmRemove = async () => {
    if (!removalTarget) return;
    setActionLoading(true);
    setError(null);
    try {
      await removeModeratedContent(removalTarget.contentId, userRole || 'admin');
      speakText(`Removed flagged content ${removalTarget.title}.`);
      setSuccessMessage(`Removed flagged content "${removalTarget.title}".`);
      setRemovalTarget(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove content.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-slate-900 dark:text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
            <span className="text-xl">🚨</span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Suspicious & Fraud Content Moderation Queue (AC-252)
            </h3>
            <p className="text-xs text-slate-400 block font-medium">
              Review 3+ distinct user report flags (AC-259), duplicate photo hashes & fraudulent listings
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 transition-colors"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Content Type Tabs (AC-253, AC-254, AC-255) */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'all', label: 'All Suspicious Items', icon: '⚡' },
          { id: 'flagged_review', label: 'Flagged Reviews (AC-253)', icon: '💬' },
          { id: 'duplicate_photo', label: 'Duplicate Photos (AC-254)', icon: '🖼️' },
          { id: 'flagged_listing', label: 'Flagged Listings (AC-255)', icon: '🛍️' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setTypeFilter(tab.id);
              setPage(1);
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              typeFilter === tab.id
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-slate-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center justify-between text-xs text-rose-700 dark:text-rose-300">
          <span>⚠️ {error}</span>
          <button
            onClick={loadData}
            className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success Notice */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
          <span>✓ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-300 font-bold hover:underline"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Queue List */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-bold">Loading moderation queue...</p>
        </div>
      ) : !paginatedData || paginatedData.items.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
          <span className="text-3xl block mb-2">✨</span>
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Moderation Queue Clear!</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No flagged reviews, duplicate photos, or suspicious listings currently pending moderation in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedData.items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Photo Preview if present */}
                {item.photoUri && (
                  <div className="w-full sm:w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                    <img src={item.photoUri} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Content Details */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                      {item.contentType.replace('_', ' ').toUpperCase()}
                    </span>

                    {/* AC-259: 3 Distinct User Reports Badge */}
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      🚩 {item.reportCount || item.reports?.length || 3} Distinct User Reports (AC-259)
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Author: <strong className="text-slate-700 dark:text-slate-200">{item.authorName}</strong></span>
                    {item.duplicateCount && (
                      <span className="text-purple-600 dark:text-purple-400 font-bold">
                        🖼️ Matched across {item.duplicateCount} listings
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons (AC-257, AC-258) */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => handleApprove(item)}
                  disabled={actionLoading}
                  aria-label={`Approve and dismiss flag for ${item.title}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center space-x-1"
                >
                  <span>✓</span>
                  <span>Approve Content (AC-257)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRemovalTarget(item)}
                  disabled={actionLoading}
                  aria-label={`Remove flagged content for ${item.title}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all flex items-center space-x-1"
                >
                  <span>✕</span>
                  <span>Remove Content (AC-258)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls (AC-256) */}
      {paginatedData && paginatedData.totalPages > 1 && (
        <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            ← Previous
          </button>

          <span className="text-slate-500">
            Page {paginatedData.page} of {paginatedData.totalPages} ({paginatedData.totalItems} Total)
          </span>

          <button
            type="button"
            disabled={page >= paginatedData.totalPages}
            onClick={() => setPage((p) => Math.min(paginatedData.totalPages, p + 1))}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Next →
          </button>
        </div>
      )}

      {/* Removal Confirmation Dialog (AC-258) */}
      {removalTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <h4 className="font-extrabold text-base text-rose-600 dark:text-rose-400">
              Confirm Content Removal (AC-258)
            </h4>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong>"{removalTarget.title}"</strong>? This will permanently delete the flagged submission and notify real-time listeners.
            </p>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRemovalTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRemove}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                {actionLoading ? 'Removing...' : 'Confirm Remove (AC-258)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

