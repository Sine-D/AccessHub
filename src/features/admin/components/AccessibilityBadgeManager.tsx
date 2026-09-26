import React, { useState, useEffect } from 'react';
import { Award, ShieldCheck, CheckCircle, RefreshCw, AlertTriangle, Calculator, Sparkles } from 'lucide-react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { AccessibilityBadgeRecord, CriteriaRatings } from '../../../types/accessibilityBadge';
import {
  fetchAccessibilityBadges,
  calculateAccessibilityScore,
  checkVerificationRules,
  awardAccessibilityBadge,
} from '../../../services/accessibilityBadgeService';
import { AccessibilityBadge } from '../../../components/accessibility/AccessibilityBadge';

export const AccessibilityBadgeManager: React.FC = () => {
  const { speakText, settings } = useAccessibility();

  const [badges, setBadges] = useState<AccessibilityBadgeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Badge Calculation Form State
  const [entityId, setEntityId] = useState('mp-new-kandy');
  const [entityType, setEntityType] = useState<'place' | 'vendor'>('place');
  const [entityName, setEntityName] = useState('Kandy Accessible Supermarket');
  const [isVerifiedInput, setIsVerifiedInput] = useState(true);

  const [ratingsInput, setRatingsInput] = useState<CriteriaRatings>({
    wheelchairRamp: 5,
    brailleMenu: 4,
    audioSignal: 4,
    accessibleRestroom: 5,
  });

  const loadBadges = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAccessibilityBadges();
      setBadges(data);
    } catch (err: any) {
      setError('Failed to load accessibility badges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const currentScore = calculateAccessibilityScore(ratingsInput);
  const currentEligibility = checkVerificationRules({
    entityId,
    entityType,
    entityName,
    ratings: ratingsInput,
    ratingCount: 5,
    isVerified: isVerifiedInput,
  });

  const handleAwardBadge = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const record = await awardAccessibilityBadge(
        {
          entityId,
          entityType,
          entityName,
          ratings: ratingsInput,
          ratingCount: 5,
          isVerified: isVerifiedInput,
        },
        'Admin Officer'
      );

      if (record.status === 'awarded') {
        const msg = `Badge awarded successfully: ${record.badgeType} (Score: ${record.score}/5.0)`;
        setSuccessMessage(msg);
        speakText(msg);
      } else {
        const msg = `Entity is ineligible for badge: ${record.reason}`;
        setError(msg);
        speakText(msg);
      }

      await loadBadges();
    } catch (err: any) {
      setError('Failed to award badge.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-700 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Award className="w-7 h-7 text-yellow-300" />
            <h2 className="text-xl font-extrabold tracking-tight">Accessibility Badge Management</h2>
          </div>
          <p className="text-xs text-teal-100 pt-1 max-w-xl">
            Evaluate accessibility score criteria (AC-87), check verification rules (AC-88), award badges (AC-89), and present badges (AC-90).
          </p>
        </div>

        <button
          onClick={loadBadges}
          disabled={loading}
          className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center space-x-1.5 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Badges</span>
        </button>
      </div>

      {/* Alert Messages */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-800 dark:text-teal-200 text-xs font-extrabold flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-teal-500 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-extrabold flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Calculator & Badge List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Score Calculator & Award Form */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Calculator className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Accessibility Score & Rule Verification (AC-87, AC-88)
            </h3>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Entity Name</label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Entity Type</label>
                <select
                  value={entityType}
                  onChange={(e) => setEntityType(e.target.value as 'place' | 'vendor')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none font-bold"
                >
                  <option value="place">Place / Location</option>
                  <option value="vendor">Vendor / Seller</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Verification Status</label>
                <button
                  type="button"
                  onClick={() => setIsVerifiedInput(!isVerifiedInput)}
                  className={`w-full py-2 px-3 rounded-xl font-extrabold text-xs transition-all border ${
                    isVerifiedInput
                      ? 'bg-teal-500/10 border-teal-500/40 text-teal-700 dark:text-teal-300'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {isVerifiedInput ? '✓ Verified Entity' : '✕ Unverified Entity'}
                </button>
              </div>
            </div>

            {/* Rating Criteria Controls (1 to 5) */}
            <div className="space-y-2 pt-2">
              <label className="font-extrabold text-slate-900 dark:text-white block">
                Criteria Ratings Input (1 – 5 Stars)
              </label>

              {[
                { label: 'Wheelchair Ramp Access', key: 'wheelchairRamp' as keyof CriteriaRatings },
                { label: 'Braille Menu / Signage', key: 'brailleMenu' as keyof CriteriaRatings },
                { label: 'Audio Signals / Announcements', key: 'audioSignal' as keyof CriteriaRatings },
                { label: 'Accessible Restroom', key: 'accessibleRestroom' as keyof CriteriaRatings },
              ].map((c) => (
                <div key={c.key} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800">
                  <span className="font-bold text-slate-700 dark:text-slate-300">{c.label}</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingsInput((prev) => ({ ...prev, [c.key]: star }))}
                        className={`w-6 h-6 rounded-md font-extrabold text-xs transition-all ${
                          ratingsInput[c.key] >= star
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                        }`}
                      >
                        {star}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculated Score Breakdown */}
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-slate-800/80 border border-teal-200 dark:border-teal-800 space-y-2">
              <div className="flex items-center justify-between font-black text-sm">
                <span>Calculated Overall Score:</span>
                <span className="text-teal-600 dark:text-teal-400 text-base">{currentScore.overallScore.toFixed(1)} / 5.0 ({currentScore.percentage}%)</span>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                <span>Rule Eligibility:</span>
                <span className={currentEligibility.isEligible ? 'text-teal-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                  {currentEligibility.isEligible ? '✓ Eligible for Badge' : '✕ Ineligible'}
                </span>
              </div>

              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700">
                {currentEligibility.reason}
              </p>
            </div>

            {/* Award Badge Action Button (AC-89) */}
            <button
              onClick={handleAwardBadge}
              disabled={loading}
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 flex items-center justify-center space-x-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Evaluate & Award Badge (AC-89)</span>
            </button>
          </div>
        </div>

        {/* Right: Active Badges Presentation List (AC-90) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Awarded Badges & Eligibility State (AC-90)
              </h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300">
              {badges.length} Badges
            </span>
          </div>

          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {badges.map((b) => (
              <div key={b.id} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-slate-900 dark:text-white">{b.entityName}</span>
                  <span className="text-[10px] font-bold text-slate-400">{b.entityType.toUpperCase()}</span>
                </div>
                <AccessibilityBadge
                  badge={b}
                  highContrast={settings.highContrast}
                  onAnnounce={(text) => speakText(text)}
                />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

