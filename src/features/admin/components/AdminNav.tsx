import React from 'react';
import { 
  LayoutDashboard, 
  UserCheck, 
  ShoppingBag, 
  ShieldAlert, 
  CheckCircle2, 
  Award, 
  BarChart3,
  Wrench,
  Users
} from 'lucide-react';
import { AdminTab } from '../types/admin';
import { useAccessibility } from '../../../core/hooks/useAccessibility';

interface AdminNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  badges?: Partial<Record<AdminTab, number>>;
}

export const AdminNav: React.FC<AdminNavProps> = ({
  activeTab,
  onTabChange,
  badges = {},
}) => {
  const { settings, speakText } = useAccessibility();

  const tabs: { id: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'vendor_verification', label: 'Vendors', icon: UserCheck },
    { id: 'listing_moderation', label: 'Listings', icon: ShoppingBag },
    { id: 'review_moderation', label: 'Reviews', icon: ShieldAlert },
    { id: 'compliance', label: 'Compliance', icon: CheckCircle2 },
    { id: 'badges', label: 'Badges', icon: Award },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'freelancers', label: 'Freelancers', icon: Wrench },
    { id: 'accounts', label: 'Accounts', icon: Users },
  ];

  const handleTabPress = (tabId: AdminTab, label: string) => {
    speakText(`Switched to Admin ${label} tab`);
    onTabChange(tabId);
  };

  return (
    <nav
      aria-label="Admin Navigation Tabs"
      className="flex items-center space-x-1.5 overflow-x-auto pb-2 pt-1 no-scrollbar select-none"
    >
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        const count = badges[t.id];

        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={isActive}
            aria-label={`${t.label} tab${count ? `, ${count} pending` : ''}`}
            onClick={() => handleTabPress(t.id, t.label)}
            className={`min-h-[48px] px-3.5 py-2.5 rounded-2xl text-xs font-extrabold shrink-0 transition-all flex items-center space-x-2 border focus:outline-none focus:ring-2 focus:ring-teal-500 ${
              isActive
                ? settings.highContrast
                  ? 'bg-yellow-300 text-black border-yellow-400 font-black'
                  : 'bg-teal-600 text-white border-teal-700 shadow-md shadow-teal-600/20'
                : settings.highContrast
                ? 'bg-black text-white border-white hover:border-yellow-300'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span>{t.label}</span>
            {count !== undefined && count > 0 && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-1 ${
                  isActive
                    ? 'bg-white text-teal-700'
                    : 'bg-amber-500 text-slate-950 animate-pulse'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

