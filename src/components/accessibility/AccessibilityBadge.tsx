import React from 'react';
import { ShieldCheck, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AccessibilityBadgeRecord } from '../../types/accessibilityBadge';

interface AccessibilityBadgeProps {
  badge: AccessibilityBadgeRecord;
  showDetails?: boolean;
  highContrast?: boolean;
  onAnnounce?: (text: string) => void;
}

export const AccessibilityBadge: React.FC<AccessibilityBadgeProps> = ({
  badge,
  showDetails = true,
  highContrast = false,
  onAnnounce,
}) => {
  const isAwarded = badge.status === 'awarded';

  const handlePress = () => {
    const speech = isAwarded
      ? `Accessibility Badge: ${badge.badgeType}. Overall accessibility score ${badge.score} out of 5.0. Verified status: ${badge.isVerified ? 'Verified' : 'Unverified'}.`
      : `Ineligible for badge: ${badge.reason}`;
    if (onAnnounce) {
      onAnnounce(speech);
    }
  };

  return (
    <div
      onClick={handlePress}
      role="region"
      aria-label={`Accessibility Badge: ${badge.badgeType}, Status: ${badge.status}, Score: ${badge.score} out of 5.0`}
      className={`inline-flex flex-col p-3 rounded-2xl border transition-all cursor-pointer select-none ${
        highContrast
          ? isAwarded
            ? 'bg-yellow-400 text-slate-950 border-yellow-300 font-extrabold'
            : 'bg-red-950 text-yellow-300 border-red-500 font-extrabold'
          : isAwarded
          ? 'bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-indigo-500/10 border-teal-500/30 text-teal-900 dark:text-teal-200 hover:border-teal-500/60 shadow-sm'
          : 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
      }`}
    >
      <div className="flex items-center space-x-2">
        {/* Visual Badge Icon */}
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
            isAwarded
              ? highContrast
                ? 'bg-slate-950 text-yellow-400'
                : 'bg-teal-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {isAwarded ? <Award className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
        </div>

        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-xs tracking-tight">♿ {badge.badgeType}</span>
            {badge.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />}
          </div>

          <div className="flex items-center space-x-2 mt-0.5 text-[11px] font-bold opacity-90">
            <span>Score: {badge.score.toFixed(1)}/5.0</span>
            <span>•</span>
            <span
              className={`px-1.5 py-0.2 rounded-md uppercase text-[9px] font-black tracking-wider ${
                isAwarded
                  ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300'
                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
              }`}
            >
              {badge.status}
            </span>
          </div>
        </div>
      </div>

      {showDetails && badge.reason && (
        <p className="text-[10px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 mt-2 leading-tight">
          {badge.reason}
        </p>
      )}
    </div>
  );
};

