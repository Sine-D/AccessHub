import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { supabase } from '../../../core/supabase';
import { AdminLayout } from '../components/AdminLayout';
import { AdminFeatureCard } from '../components/AdminFeatureCard';
import { AdminEmptyState } from '../components/AdminStates';
import { VendorVerificationQueue } from '../components/VendorVerificationQueue';
import { ListingModerationQueue } from '../components/ListingModerationQueue';
import { FraudModerationQueue } from '../components/FraudModerationQueue';
import { AccessibilityBadgeManager } from '../components/AccessibilityBadgeManager';
import { SubmitVerificationModal } from '../../vendor/components/SubmitVerificationModal';
import { AdminTab, AdminFeature } from '../types/admin';
import { 
  UserCheck, 
  ShoppingBag, 
  ShieldAlert, 
  CheckCircle2, 
  Award, 
  BarChart3, 
  Wrench, 
  Users, 
  ExternalLink
} from 'lucide-react';

export const AdminScreen: React.FC = () => {
  const { 
    servicesList,
    pendingServiceApplications, 
    approveServiceApplication, 
    rejectServiceApplication,
    bookingRequests,
    setActiveScreen
  } = useAppState();

  const { speakText } = useAccessibility();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [justApprovedName, setJustApprovedName] = useState<string | null>(null);
  const [realUsers, setRealUsers] = useState<any[]>([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const fetchSupabaseUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.from('users').select('*');
      if (err) {
        console.warn('Notice querying Supabase users:', err.message);
      }
      if (data) {
        setRealUsers(data);
      }
    } catch (err: any) {
      console.warn('Error fetching Supabase users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSupabaseUsers();
  }, [activeTab]);

  const handleApproveFreelancer = (id: string, name: string, serviceTitle: string) => {
    approveServiceApplication(id);
    setJustApprovedName(name);
    speakText(`Confirmed approval for freelancer application ${name}.`);
    setTimeout(() => {
      setJustApprovedName(null);
    }, 4000);
  };

  const featureModules: AdminFeature[] = [
    {
      id: 'vendor_verification',
      title: 'Vendor Verification',
      description: 'Verify disabled vendor credentials, medical certificates, identity proofs, and assign verified status badges.',
      iconName: 'UserCheck',
      acReference: 'AC-51–56',
      badgeCount: 2,
      badgeText: 'Live Workflow Active',
      status: 'active'
    },
    {
      id: 'listing_moderation',
      title: 'Listing Moderation',
      description: 'Review submitted product listings, inspect accessibility attributes and alt text, approve or request revisions.',
      iconName: 'ShoppingBag',
      acReference: 'AC-57–62',
      badgeCount: 3,
      badgeText: 'Live Workflow Active',
      status: 'active'
    },
    {
      id: 'review_moderation',
      title: 'Suspicious & Fraud Review Moderation',
      description: 'Moderate reported and flagged accessibility reviews, inspect rating anomalies, dismiss flags or remove fraudulent submissions.',
      iconName: 'ShieldAlert',
      acReference: 'AC-252–263',
      badgeCount: 4,
      badgeText: 'Live Workflow Active',
      status: 'active',
    },
    {
      id: 'compliance',
      title: 'Accessibility Compliance Monitoring',
      description: 'Monitor platform WCAG AA/AAA compliance, audit missing alt-text and feature tags, and generate compliance reports.',
      iconName: 'CheckCircle2',
      acReference: 'AC-68–71',
      badgeCount: 0,
      status: 'ready'
    },
    {
      id: 'badges',
      title: 'Accessibility Badge System',
      description: 'Evaluate multi-criteria accessibility ratings, calculate place and vendor badge tiers, manage automated badge awards.',
      iconName: 'Award',
      acReference: 'AC-86–90',
      badgeCount: 4,
      badgeText: 'Live Workflow Active',
      status: 'active'
    },
    {
      id: 'analytics',
      title: 'Sales Analytics Dashboard',
      description: 'Track platform GMV, completed orders, 10% commission earnings, top-selling categories, and Sri Lanka district distribution.',
      iconName: 'BarChart3',
      acReference: 'AC-63–67',
      badgeCount: 0,
      status: 'ready'
    }
  ];

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'UserCheck': return UserCheck;
      case 'ShoppingBag': return ShoppingBag;
      case 'ShieldAlert': return ShieldAlert;
      case 'CheckCircle2': return CheckCircle2;
      case 'Award': return Award;
      case 'BarChart3': return BarChart3;
      default: return UserCheck;
    }
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      onTabChange={setActiveTab}
      isLoading={isLoading}
      error={error}
      onRetry={fetchSupabaseUsers}
    >
      {/* SUCCESS APPROVAL ALERT */}
      {justApprovedName && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>Approved <strong>{justApprovedName}</strong>! Application published to Navbar Services.</span>
          </div>
          <button
            onClick={() => setActiveScreen('services')}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold shrink-0 flex items-center space-x-1"
          >
            <span>View Services</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* OVERVIEW DASHBOARD VIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Quick Metrics Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Users</span>
              <p className="font-extrabold text-lg text-slate-900 dark:text-white">{realUsers.length}</p>
              <span className="text-[10px] text-teal-500 font-semibold">● Live Supabase Synced</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Pending Verifications</span>
              <p className="font-extrabold text-lg text-amber-500">2</p>
              <span className="text-[10px] text-amber-500 font-semibold">Requires Inspection</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Active Services</span>
              <p className="font-extrabold text-lg text-slate-900 dark:text-white">{servicesList.length}</p>
              <span className="text-[10px] text-emerald-500 font-semibold">Published Services</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Active Orders</span>
              <p className="font-extrabold text-lg text-blue-500">{bookingRequests.length}</p>
              <span className="text-[10px] text-blue-500 font-semibold">Escrow Tracked</span>
            </div>
          </div>

          {/* 6 Feature Module Placeholders Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                Admin Feature Modules
              </h3>
              <span className="text-[10px] font-bold text-teal-500">Vendor Verification Live</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {featureModules.map((module) => (
                <AdminFeatureCard
                  key={module.id}
                  id={module.id}
                  title={module.title}
                  description={module.description}
                  icon={getIconComponent(module.iconName)}
                  acReference={module.acReference}
                  badgeCount={module.badgeCount}
                  badgeText={module.badgeText}
                  status={module.status}
                  onOpen={setActiveTab}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VENDOR VERIFICATION WORKFLOW TAB (AC-51–56) */}
      {activeTab === 'vendor_verification' && (
        <VendorVerificationQueue
          onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        />
      )}

      {/* LISTING MODERATION QUEUE (AC-57–62) */}
      {activeTab === 'listing_moderation' && (
        <ListingModerationQueue />
      )}

      {/* SUSPICIOUS & FRAUD REVIEW MODERATION QUEUE (AC-252–263) */}
      {activeTab === 'review_moderation' && (
        <FraudModerationQueue />
      )}

      {/* COMPLIANCE MONITORING PLACEHOLDER (AC-68–71) */}
      {activeTab === 'compliance' && (
        <AdminEmptyState
          title="Accessibility Compliance Monitoring (AC-68–71)"
          message="This workspace foundation is prepared for Accessibility Compliance Monitoring. Future implementation will connect platform WCAG scorecards, alt-text audits, and non-compliance flags here."
          icon={CheckCircle2}
          actionLabel="Return to Overview"
          onAction={() => setActiveTab('overview')}
        />
      )}

      {/* ACCESSIBILITY BADGES SYSTEM (AC-86–90) */}
      {activeTab === 'badges' && (
        <AccessibilityBadgeManager />
      )}

      {/* SALES ANALYTICS PLACEHOLDER (AC-63–67) */}
      {activeTab === 'analytics' && (
        <AdminEmptyState
          title="Sales Analytics Dashboard (AC-63–67)"
          message="This workspace foundation is prepared for Sales Analytics. Future implementation will connect time-series GMV charts, category sales metrics, and Sri Lanka district distribution reports here."
          icon={BarChart3}
          actionLabel="Return to Overview"
          onAction={() => setActiveTab('overview')}
        />
      )}

      {/* FREELANCER APPROVALS TAB */}
      {activeTab === 'freelancers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Pending Freelancer Approvals ({pendingServiceApplications.length})
            </h3>
          </div>

          {pendingServiceApplications.length === 0 ? (
            <AdminEmptyState
              title="All Applications Reviewed"
              message="No pending freelancer registration requests in queue."
              icon={CheckCircle2}
            />
          ) : (
            <div className="space-y-3">
              {pendingServiceApplications.map((app) => (
                <div key={app.id} className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{app.name}</h4>
                      <span className="text-xs text-teal-600 dark:text-teal-400 font-bold block mt-0.5">
                        📍 {app.district} District • {app.serviceTitle}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400">
                      LKR {Number(app.hourlyRate).toLocaleString()} / hr
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {app.description}
                  </p>

                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => handleApproveFreelancer(app.id, app.name, app.serviceTitle)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve Application</span>
                    </button>
                    <button
                      onClick={() => rejectServiceApplication(app.id)}
                      className="py-2.5 px-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-extrabold text-xs"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ACCOUNTS TAB */}
      {activeTab === 'accounts' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Registered User Accounts ({realUsers.length})</span>
            </h3>
            <button
              onClick={fetchSupabaseUsers}
              className="text-[10px] font-extrabold px-2.5 py-1 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 border border-teal-500/30"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="space-y-2">
            {realUsers.map((user, idx) => (
              <div key={user.id || idx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-xs uppercase">
                    {(user.name || user.email || 'U').charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900 dark:text-white">{user.name || 'Registered User'}</span>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 uppercase">
                        {user.role || 'Buyer'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{user.email || user.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VENDOR VERIFICATION SUBMIT MODAL (AC-52) */}
      <SubmitVerificationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
      />
    </AdminLayout>
  );
};
