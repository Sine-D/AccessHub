import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { AdminNav } from './AdminNav';
import { 
  AdminLoadingState, 
  AdminErrorState, 
  AdminUnauthorizedState 
} from './AdminStates';
import { AdminLayoutProps } from '../types/admin';

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activeTab,
  onTabChange,
  isLoading = false,
  error = null,
  onRetry,
  title = 'Admin Management Hub 🛡️',
  subtitle = 'Central control center for vendor verification, marketplace moderation, compliance, and platform analytics.',
}) => {
  const { userRole, currentUser } = useAppState();
  const { settings } = useAccessibility();

  // Integrated Authorization Check: Allow if userRole is 'admin' or currentUser role is 'admin'
  const isAuthorized = userRole === 'admin' || currentUser?.role === 'admin';

  return (
    <div
      className={`w-full h-full min-h-[800px] flex flex-col justify-between overflow-y-auto ${
        settings.highContrast
          ? 'bg-black text-white'
          : 'bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white'
      }`}
    >
      <TopHeader title="Admin Dashboard 🛡️" />

      <main className="p-4 space-y-4 pb-8 flex-1 max-w-5xl mx-auto w-full">
        {/* Banner Header */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl space-y-2 border border-slate-700 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>AccessHub Administration System</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Verified Role: {currentUser.role || userRole}
            </span>
          </div>

          <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        </div>

        {/* Integrated Role Guard Fallback */}
        {!isAuthorized ? (
          <AdminUnauthorizedState />
        ) : (
          <>
            {/* Modular Tab Navigation */}
            <AdminNav activeTab={activeTab} onTabChange={onTabChange} />

            {/* Dynamic State Handlers & Content Body */}
            {isLoading ? (
              <AdminLoadingState />
            ) : error ? (
              <AdminErrorState message={error} onRetry={onRetry} />
            ) : (
              <div className="space-y-4 animate-fadeIn">{children}</div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

