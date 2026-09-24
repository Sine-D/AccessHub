import React, { useState, useEffect } from 'react';
import { Product, ListingModerationStatus } from '../../../core/types/models';
import {
  fetchMarketplaceListings,
  approveListing,
  rejectListing,
} from '../../../services/listingModerationService';
import { ListingDetailModal } from './ListingDetailModal';
import { useAccessibility } from '../../../core/hooks/useAccessibility';

export const ListingModerationQueue: React.FC = () => {
  const { speakText } = useAccessibility();

  const [listings, setListings] = useState<Product[]>([]);
  const [filter, setFilter] = useState<'all' | ListingModerationStatus>('pending');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector modal target
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick reject prompt modal target
  const [quickRejectTarget, setQuickRejectTarget] = useState<Product | null>(null);
  const [quickReason, setQuickReason] = useState('');

  const loadListings = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMarketplaceListings();
      setListings(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch marketplace listings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  const handleApprove = async (id: string) => {
    const item = listings.find((p) => p.id === id);
    await approveListing(id);
    speakText(`Listing ${item?.title || ''} approved successfully.`);
    await loadListings();
  };

  const handleReject = async (id: string, reason: string) => {
    const item = listings.find((p) => p.id === id);
    await rejectListing(id, reason);
    speakText(`Listing ${item?.title || ''} rejected. Feedback recorded.`);
    await loadListings();
  };

  const handleConfirmQuickReject = async () => {
    if (!quickRejectTarget) return;
    const finalReason = quickReason.trim() || 'Listing does not comply with accessibility standards.';
    await handleReject(quickRejectTarget.id, finalReason);
    setQuickRejectTarget(null);
    setQuickReason('');
  };

  const categories = ['All', ...Array.from(new Set(listings.map((p) => p.category)))];

  const filtered = listings.filter((p) => {
    const matchesFilter = filter === 'all' || (p.moderationStatus || 'pending') === filter;
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.sellerName.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.accessibilityFeatures || []).some((f) => f.toLowerCase().includes(q));
    return matchesFilter && matchesCategory && matchesSearch;
  });

  const pendingCount = listings.filter((p) => (p.moderationStatus || 'pending') === 'pending').length;
  const approvedCount = listings.filter((p) => p.moderationStatus === 'approved').length;
  const rejectedCount = listings.filter((p) => p.moderationStatus === 'rejected').length;

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <span className="text-xl">🛍️</span>
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Marketplace Listing Moderation (AC-57)
            </h3>
            <span className="text-xs text-slate-400 block font-medium">
              Review seller products, audit accessibility tags & verify image alt-text
            </span>
          </div>
        </div>

        <button
          onClick={loadListings}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 transition-colors"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            filter === 'pending'
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Pending Review</span>
          <span className="font-extrabold text-lg text-amber-600 dark:text-amber-400">{pendingCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'approved' ? 'all' : 'approved')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            filter === 'approved'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Approved</span>
          <span className="font-extrabold text-lg text-emerald-600 dark:text-emerald-400">{approvedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter(filter === 'rejected' ? 'all' : 'rejected')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            filter === 'rejected'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Rejected</span>
          <span className="font-extrabold text-lg text-rose-600 dark:text-rose-400">{rejectedCount}</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`p-3 rounded-2xl border text-left transition-all ${
            filter === 'all'
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 block uppercase">Total Listings</span>
          <span className="font-extrabold text-lg text-slate-900 dark:text-white">{listings.length}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search listings by title, seller, category, or features..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-3 text-xs text-slate-400">🔍</span>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === 'All' ? 'All Categories' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex space-x-1.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-bold">Loading marketplace listings...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-rose-50 dark:bg-rose-950/30 rounded-3xl border border-rose-200 dark:border-rose-900">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
          <button
            onClick={loadListings}
            className="mt-3 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed">
          <span className="text-3xl block mb-2">📋</span>
          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">No listings found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search
              ? 'No listings match your search query. Try clearing filters.'
              : `There are no listings in the "${filter}" queue right now.`}
          </p>
        </div>
      ) : (
        /* Listing Cards */
        <div className="space-y-3">
          {filtered.map((item) => {
            const isPending = (item.moderationStatus || 'pending') === 'pending';
            const isApproved = item.moderationStatus === 'approved';
            const isRejected = item.moderationStatus === 'rejected';

            return (
              <div
                key={item.id}
                className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row gap-3.5">
                  {/* Thumbnail with alt-text indicator */}
                  <div className="w-full sm:w-28 h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950 shrink-0 border border-slate-200 dark:border-slate-800 relative">
                    <img
                      src={item.image}
                      alt={item.altText || item.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      title={item.altText ? `Alt-Text: ${item.altText}` : 'Missing Alt-Text'}
                      className={`absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold backdrop-blur-md ${
                        item.altText
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/50'
                          : 'bg-rose-950/80 text-rose-300 border border-rose-700/50'
                      }`}
                    >
                      {item.altText ? 'ALT ✓' : 'NO ALT ⚠️'}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                            isApproved
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                              : isRejected
                              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                          }`}
                        >
                          {isApproved ? '✓ APPROVED' : isRejected ? '✕ REJECTED' : '⏳ PENDING REVIEW'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">• {item.category}</span>
                      </div>

                      <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                        LKR {item.price.toLocaleString()}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h4>

                    {/* Seller & Disability Badge */}
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <img
                        src={item.sellerAvatar}
                        alt={item.sellerName}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {item.sellerName}
                      </span>
                      {item.disabilityBadge && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          ♿ {item.disabilityBadge}
                        </span>
                      )}
                    </div>

                    {/* Accessibility tags preview */}
                    {item.accessibilityFeatures && item.accessibilityFeatures.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.accessibilityFeatures.map((f, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                          >
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Rejection reason notice if rejected */}
                    {item.rejectionReason && (
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-600 dark:text-rose-400">
                        <span className="font-bold">⚠️ Rejection Feedback:</span> {item.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(item);
                      setIsModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-bold flex items-center space-x-1 transition-colors"
                  >
                    <span>👁️</span>
                    <span>Inspect Details & Alt-Text (AC-58)</span>
                  </button>

                  {isPending && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setQuickRejectTarget(item);
                          setQuickReason('');
                        }}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-bold transition-colors"
                      >
                        ✕ Reject (AC-60)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
                      >
                        ✓ Approve (AC-59)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Inspector Modal (AC-58) */}
      <ListingDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Quick Reject Modal (AC-60, AC-61) */}
      {quickRejectTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
        >
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div>
              <h4 className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                Reject Listing: {quickRejectTarget.title} (AC-60)
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Provide feedback to explain what needs to be corrected (AC-61).
              </p>
            </div>

            <textarea
              value={quickReason}
              onChange={(e) => setQuickReason(e.target.value)}
              rows={3}
              placeholder="e.g. Missing image alt-text, unverified tactile features, or incomplete specifications..."
              className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setQuickRejectTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmQuickReject}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
              >
                Confirm Rejection (AC-60)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

