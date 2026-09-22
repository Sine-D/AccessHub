import React from 'react';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { AdminTab } from '../types/admin';

export interface AdminFeatureCardProps {
  id: AdminTab;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  acReference: string;
  badgeCount?: number;
  badgeText?: string;
  status?: 'ready' | 'pending_module' | 'active';
  onOpen: (tab: AdminTab) => void;
}

export const AdminFeatureCard: React.FC<AdminFeatureCardProps> = ({
  id,
  title,
  description,
  icon: Icon,
  acReference,
  badgeCount,
  badgeText = 'Ready for Plug-in',
  status = 'ready',
  onOpen,
}) => {
  const { settings, speakText } = useAccessibility();

  const handleCardClick = () => {
    speakText(`Opening ${title} admin section`);
    onOpen(id);
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`${title}: ${description}. Acceptance Criteria: ${acReference}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className={`p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-500 ${
        settings.highContrast
          ? 'bg-black text-white border-white hover:border-yellow-300'
          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 hover:border-teal-500/50 shadow-sm'
      }`}
    >
      {/* Header Row: Icon & Status Tag */}
      <div className="flex items-start justify-between">
        <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-all shrink-0">
          <Icon className="w-5 h-5 stroke-[2.5]" />
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            {acReference}
          </span>
          {badgeCount !== undefined && badgeCount > 0 ? (
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
              {badgeCount} Pending
            </span>
          ) : (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
              {badgeText}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-1">
        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
          {title}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-extrabold text-teal-600 dark:text-teal-400">
        <span>Manage Module</span>
        <div className="flex items-center space-x-1 group-hover:translate-x-1 transition-transform">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
};

