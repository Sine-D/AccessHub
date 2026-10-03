import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  FileCheck,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { fetchAccessibilityBadges } from '../../../services/accessibilityBadgeService';
import { fetchMarketplaceListings } from '../../../services/listingModerationService';
import { AccessibilityBadgeRecord } from '../../../types/accessibilityBadge';
import { Product } from '../../../core/types/models';
import { AdminTab } from '../types/admin';

interface AccessibilityComplianceDashboardProps {
  onNavigateTab?: (tab: AdminTab) => void;
}

export const AccessibilityComplianceDashboard: React.FC<AccessibilityComplianceDashboardProps> = ({
  onNavigateTab,
}) => {
  const { settings, speakText } = useAccessibility();

  const [badges, setBadges] = useState<AccessibilityBadgeRecord[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [badgeData, productData] = await Promise.all([
        fetchAccessibilityBadges(),
        fetchMarketplaceListings(),
      ]);
      setBadges(badgeData);
      setProducts(productData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load accessibility compliance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAudited = badges.length + products.length;
  const compliantBadges = badges.filter((b) => b.status === 'awarded');
  const nonCompliantListings = products.filter((l) => !l.accessibilityFeatures || l.accessibilityFeatures.length === 0);
  
  const overallScorePercent = totalAudited > 0 ? Math.round(((compliantBadges.length + (products.length - nonCompliantListings.length)) / totalAudited) * 100) : 100;

  return (
    <div className="space-y-6" role="region" aria-label="Accessibility Compliance Monitoring Hub">
      {/* Top Banner Header (Matches Sales Analytics & Badge Manager Top Banner) */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-teal-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-7 h-7 text-teal-400" />
            <h2 className="text-xl font-extrabold tracking-tight">
              Accessibility Compliance Monitoring
            </h2>
          </div>
          <p className="text-xs text-slate-300 pt-1 max-w-xl">
            Monitor platform WCAG AA/AAA compliance scorecards, audit missing image alt-text, inspect accessibility feature tags, and enforce compliance guidelines.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs flex items-center space-x-1.5 transition-all shadow-md self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Audit Compliance</span>
        </button>
      </div>

      {/* Metric Cards Summary (Matches Admin Metric Cards Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rating */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Overall WCAG Score</span>
          <p className="text-2xl font-black text-teal-600 dark:text-teal-400">{overallScorePercent}% Compliant</p>
          <p className="text-[11px] font-bold text-teal-600 dark:text-teal-400">● WCAG AA / AAA Standard</p>
        </div>

        {/* Awarded Badges */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Certified Badges</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{compliantBadges.length} Active</p>
          <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Verified Places & Vendors</p>
        </div>

        {/* Missing Alt-Text Flags */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Alt-Text Audits</span>
          <p className="text-2xl font-black text-amber-500">{nonCompliantListings.length} Audited Flags</p>
          <p className="text-[11px] font-bold text-amber-500">Requires Image Descriptions</p>
        </div>

        {/* Audited Records */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-2">
          <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Audited Records</span>
          <p className="text-2xl font-black text-blue-500">{totalAudited} Items</p>
          <p className="text-[11px] font-bold text-blue-500">Continuous Monitoring</p>
        </div>
      </div>

      {/* Compliance Audit Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <FileCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Accessibility Compliance Audit Records ({badges.length})
            </h3>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('badges')}
              className="text-xs font-extrabold text-teal-600 dark:text-teal-400 flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <span>Manage Badge Criteria</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs font-bold">Auditing compliance scorecards...</div>
        ) : badges.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs font-bold">No audit records found.</div>
        ) : (
          <div className="space-y-3">
            {badges.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {b.entityName}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        b.status === 'awarded'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {b.badgeType}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    WCAG Score: <strong className="text-slate-900 dark:text-white">{b.score.toFixed(1)} / 5.0</strong> • Verified Status:{' '}
                    <strong className="text-slate-900 dark:text-white">{b.isVerified ? 'Verified' : 'Pending Verification'}</strong>
                  </p>
                  {b.reason && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
                      Audit Notes: "{b.reason}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    {b.status === 'awarded' ? '✓ WCAG AA Compliant' : '✕ Action Required'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
