import React, { useState } from 'react';
import { Product } from '../../../core/types/models';

interface ListingDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const ListingDetailModal: React.FC<ListingDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  if (!isOpen || !product) return null;

  const currentImage = selectedImage || product.image;
  const isPending = (product.moderationStatus || 'pending') === 'pending';
  const isApproved = product.moderationStatus === 'approved';
  const isRejected = product.moderationStatus === 'rejected';

  const quickRejectionTemplates = [
    'Missing or inaccurate image alt-text for screen reader users.',
    'Accessibility feature claims are unverified or lack evidence.',
    'Product specifications and materials are incomplete.',
    'Price does not align with marketplace accessibility standards.',
    'Item photo is blurry, low resolution, or contains watermarks.',
  ];

  const handleApprove = async () => {
    setIsActionLoading(true);
    try {
      await onApprove(product.id);
      onClose();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    const finalReason = rejectionReason.trim() || 'Listing does not comply with marketplace accessibility guidelines.';
    setIsActionLoading(true);
    try {
      await onReject(product.id, finalReason);
      setIsRejecting(false);
      setRejectionReason('');
      onClose();
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🛍️</span>
            <div>
              <h3 id="listing-modal-title" className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                Marketplace Listing Inspector (AC-58)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit accessibility claims, alt-text quality & seller credentials
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-sm transition-colors"
            aria-label="Close listing inspection modal"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-900 dark:text-white">
          {/* Main Visual & Image Alt-Text Inspection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-full h-56 rounded-2xl bg-slate-100 dark:bg-slate-950 overflow-hidden border border-slate-200 dark:border-slate-800 relative">
                <img
                  src={currentImage}
                  alt={product.altText || product.title}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-slate-900/80 text-white">
                  {product.category}
                </span>
              </div>

              {/* Gallery Thumbnails */}
              {product.gallery && product.gallery.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {[product.image, ...product.gallery].map((imgUrl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(imgUrl)}
                      className={`w-12 h-12 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                        currentImage === imgUrl ? 'border-blue-500 scale-95' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Meta & Pricing */}
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isApproved
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800'
                        : isRejected
                        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                    }`}
                  >
                    {isApproved ? '✓ Approved' : isRejected ? '✕ Rejected' : '⏳ Pending Review'}
                  </span>
                  <span className="text-xs text-slate-400">ID: {product.id}</span>
                </div>

                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white mt-1.5 leading-snug">
                  {product.title}
                </h4>
              </div>

              {/* Pricing */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Retail Price</span>
                  <span className="font-extrabold text-lg text-blue-600 dark:text-blue-400">
                    LKR {product.price.toLocaleString()}
                  </span>
                </div>
                {product.originalPrice && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Original</span>
                    <span className="text-xs text-slate-400 line-through">
                      LKR {product.originalPrice.toLocaleString()}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Stock</span>
                  <span className={`text-xs font-bold ${product.inStock ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {product.inStock ? '● In Stock' : '○ Out of Stock'}
                  </span>
                </div>
              </div>

              {/* Seller Card */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex items-center space-x-3">
                <img
                  src={product.sellerAvatar}
                  alt={product.sellerName}
                  className="w-10 h-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {product.sellerName}
                    </span>
                    {product.disabilityBadge && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                        ♿ {product.disabilityBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block">
                    ★ {product.sellerRating} ({product.reviewsCount} reviews) • {product.sellerPhone || 'Contact verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alt-Text Audit Box (WCAG AA Compliance) */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center space-x-1">
                <span>👁️</span>
                <span>Screen-Reader Image Alt-Text (WCAG 1.1.1):</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  product.altText
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                }`}
              >
                {product.altText ? '✓ Alt-Text Provided' : '⚠️ Missing Alt-Text'}
              </span>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 italic font-mono bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
              "{product.altText || 'No descriptive alt text provided by seller.'}"
            </p>
          </div>

          {/* Accessibility Features Checklist */}
          <div className="space-y-2">
            <h5 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Declared Accessibility Features ({product.accessibilityFeatures?.length || 0})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {product.accessibilityFeatures && product.accessibilityFeatures.length > 0 ? (
                product.accessibilityFeatures.map((feat, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                  >
                    ✓ {feat}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No specific accessibility features declared.</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h5 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Product Description
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              {product.description || 'No description provided.'}
            </p>
          </div>

          {/* Specifications */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="space-y-2">
              <h5 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                Technical Specifications
              </h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(product.specifications).map(([key, val]) => (
                  <div
                    key={key}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800"
                  >
                    <span className="text-slate-400 block text-[10px] font-bold uppercase">{key}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Previous Rejection Reason Notice */}
          {product.rejectionReason && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 space-y-1">
              <span className="text-xs font-extrabold text-rose-700 dark:text-rose-300 flex items-center space-x-1">
                <span>⚠️</span>
                <span>Documented Rejection Feedback:</span>
              </span>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                {product.rejectionReason}
              </p>
            </div>
          )}

          {/* Rejection Input Section (AC-61) */}
          {isRejecting && (
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <h5 className="font-extrabold text-xs text-rose-700 dark:text-rose-300">
                  Select or Enter Rejection Reason (AC-61)
                </h5>
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Cancel
                </button>
              </div>

              {/* Template Chips */}
              <div className="flex flex-wrap gap-1.5">
                {quickRejectionTemplates.map((template, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRejectionReason(template)}
                    className="text-[11px] text-left px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    + {template}
                  </button>
                ))}
              </div>

              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                placeholder="Write specific feedback to help the seller fix accessibility or compliance issues..."
                className="w-full p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRejecting(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={isActionLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center space-x-1"
                >
                  {isActionLoading ? <span>Processing...</span> : <span>Confirm Rejection (AC-60)</span>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>

          {!isRejecting && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsRejecting(true)}
                disabled={isActionLoading}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors flex items-center space-x-1"
              >
                <span>✕</span>
                <span>Reject Listing (AC-60)</span>
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isActionLoading}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1"
              >
                {isActionLoading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Approve Listing (AC-59)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

