import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ShieldCheck, 
  FileText, 
  Plus, 
  RefreshCw 
} from 'lucide-react';
import { VendorVerificationRequest, VerificationStatus } from '../../../types/vendorVerification';
import { 
  fetchVendorVerifications, 
  approveVendorVerification, 
  rejectVendorVerification 
} from '../../../services/vendorVerificationService';
import { VendorVerificationModal } from './VendorVerificationModal';
import { AdminLoadingState, AdminErrorState, AdminEmptyState } from './AdminStates';
import { useAccessibility } from '../../../core/hooks/useAccessibility';

interface VendorVerificationQueueProps {
  onOpenSubmitModal?: () => void;
}

export const VendorVerificationQueue: React.FC<VendorVerificationQueueProps> = ({
  onOpenSubmitModal,
}) => {
  const { settings, speakText } = useAccessibility();

  const [requests, setRequests] = useState<VendorVerificationRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | VerificationStatus>('all');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<VendorVerificationRequest | null>(null);

  const loadRequests = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchVendorVerifications();
      setRequests(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch vendor verification requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleApprove = async (id: string, userId: string, badge: string) => {
    await approveVendorVerification(id, userId, badge);
    await loadRequests();
  };

  const handleReject = async (id: string, reason: string) => {
    await rejectVendorVerification(id, reason);
    await loadRequests();
  };

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesSearch =
      r.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      r.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.district.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Top Controls: Search, Filter Tabs & New Request Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
            <UserCheck className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
              Vendor Verification Queue (AC-51)
            </h3>
            <span className="text-xs text-slate-400 block font-medium">
              Review disabled vendor identity credentials & medical board documents
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenSubmitModal && (
            <button
              onClick={() => {
                speakText('Opening Vendor Verification Submission Form');
                onOpenSubmitModal();
              }}
              className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold flex items-center space-x-1.5 shadow-md transition-all focus:ring-2 focus:ring-teal-500"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Submit New Request (AC-52)</span>
            </button>
          )}

          <button
            onClick={loadRequests}
            aria-label="Refresh vendor verification list"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1">
          {[
            { id: 'all', label: 'All Requests' },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  speakText(`Filtered by ${tab.label}`);
                  setStatusFilter(tab.id as any);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all border ${
                  isActive
                    ? settings.highContrast
                      ? 'bg-yellow-300 text-black border-yellow-400'
                      : 'bg-teal-600 text-white border-teal-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search vendor name, doc #, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
      </div>

      {/* Queue Body State Management */}
      {isLoading ? (
        <AdminLoadingState message="Fetching vendor verification queue..." />
      ) : error ? (
        <AdminErrorState message={error} onRetry={loadRequests} />
      ) : filteredRequests.length === 0 ? (
        <AdminEmptyState
          title="No Verification Requests Found"
          message={
            search || statusFilter !== 'all'
              ? 'No verification requests match your current search or status filter.'
              : 'There are currently no pending vendor verification requests in queue.'
          }
          icon={UserCheck}
        />
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className={`p-4 rounded-3xl border transition-all space-y-3 shadow-md ${
                settings.highContrast
                  ? 'bg-black text-white border-white'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              {/* Header Row */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                      {req.vendorName}
                    </h4>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      ♿ {req.disabilityBadge}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                    📍 {req.district} District • {req.email} • {req.phone}
                  </span>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                    req.status === 'approved'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                      : req.status === 'rejected'
                      ? 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 animate-pulse'
                  }`}
                >
                  ● {req.status}
                </span>
              </div>

              {/* Document Summary Bar */}
              <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-teal-500 shrink-0" />
                  <div>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200">
                      {req.documentType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-slate-400 text-[11px] block font-mono">
                      Ref #: {req.documentNumber}
                    </span>
                  </div>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                </span>
              </div>

              {req.rejectionReason && (
                <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 p-2.5 rounded-xl italic border border-red-200/60">
                  Rejection Reason: "{req.rejectionReason}"
                </p>
              )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setSelectedRequest(req)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center space-x-1.5 transition-all focus:ring-2 focus:ring-teal-500"
                >
                  <Eye className="w-4 h-4" />
                  <span>Inspect Documents (AC-53)</span>
                </button>

                {req.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(req.id, req.userId, req.disabilityBadge)}
                      className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center space-x-1 shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>

                    <button
                      onClick={() => setSelectedRequest(req)}
                      className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-extrabold text-xs hover:bg-red-200"
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Inspector Modal */}
      {selectedRequest && (
        <VendorVerificationModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  );
};

