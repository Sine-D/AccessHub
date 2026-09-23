import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  FileText, 
  User, 
  Phone, 
  MapPin, 
  ExternalLink,
  AlertTriangle,
  Building2,
  Calendar
} from 'lucide-react';
import { VendorVerificationRequest } from '../../../types/vendorVerification';
import { useAccessibility } from '../../../core/hooks/useAccessibility';

interface VendorVerificationModalProps {
  request: VendorVerificationRequest | null;
  onClose: () => void;
  onApprove: (id: string, userId: string, badge: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const VendorVerificationModal: React.FC<VendorVerificationModalProps> = ({
  request,
  onClose,
  onApprove,
  onReject,
}) => {
  const { settings, speakText } = useAccessibility();

  const [mode, setMode] = useState<'inspect' | 'reject_form'>('inspect');
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!request) return null;

  const handleConfirmApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(request.id, request.userId, request.disabilityBadge);
      speakText(`Approved verification for ${request.vendorName}. Badge granted.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setError('Please provide a specific rejection reason for the applicant.');
      return;
    }
    setError(null);
    setIsProcessing(true);
    try {
      await onReject(request.id, rejectionReason.trim());
      speakText(`Rejected verification for ${request.vendorName}. Feedback saved.`);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject verification.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case 'medical_board_cert': return 'Medical Board Disability Certificate';
      case 'ngo_charter': return 'Official NGO Registration Charter';
      case 'disability_certificate': return 'Government Disability Identity Card';
      case 'national_id': return 'National Identity Card';
      default: return type;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-xl rounded-3xl p-5 space-y-4 shadow-2xl relative my-auto border ${
          settings.highContrast
            ? 'bg-black text-white border-yellow-300'
            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-500" />
            <h3 id="modal-title" className="font-extrabold text-sm sm:text-base">
              Vendor Verification Document Inspector (AC-53)
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close verification modal"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white font-extrabold flex items-center justify-center transition-all focus:ring-2 focus:ring-teal-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 dark:text-red-300 text-xs font-bold flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode 1: Inspection View */}
        {mode === 'inspect' && (
          <div className="space-y-4">
            {/* Vendor Profile Header Card */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white space-y-2 border border-slate-700 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-base text-white">{request.vendorName}</h4>
                  <span className="text-xs text-slate-300 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>{request.district} District • {request.email}</span>
                  </span>
                </div>
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase border ${
                    request.status === 'approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : request.status === 'rejected'
                      ? 'bg-red-500/20 text-red-300 border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  ● {request.status}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-700/60">
                <span className="text-slate-300">Requested Badge:</span>
                <span className="font-extrabold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-md border border-teal-500/30">
                  ♿ {request.disabilityBadge}
                </span>
              </div>
            </div>

            {/* Document Metadata Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[9px] block">Document Type:</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                  {getDocTypeLabel(request.documentType)}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[9px] block">Certificate / Reg Number:</span>
                <span className="font-mono font-extrabold text-teal-600 dark:text-teal-400 block truncate">
                  {request.documentNumber}
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[9px] block">Contact Phone:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-teal-500" />
                  <span>{request.phone}</span>
                </span>
              </div>

              <div>
                <span className="font-bold text-slate-400 uppercase text-[9px] block">Submission Date:</span>
                <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{new Date(request.submittedAt).toLocaleDateString()}</span>
                </span>
              </div>

              {request.guardianName && (
                <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-400 uppercase text-[9px] block">Guardian Details:</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">
                    {request.guardianName} ({request.guardianPhone || 'N/A'})
                  </span>
                </div>
              )}
            </div>

            {/* Uploaded Document Image Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
                <span className="flex items-center space-x-1">
                  <FileText className="w-4 h-4 text-teal-500" />
                  <span>Uploaded Verification Proof Document</span>
                </span>
                <a
                  href={request.documentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-600 dark:text-teal-400 hover:underline flex items-center space-x-0.5 text-[11px]"
                >
                  <span>Full View</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative">
                <img
                  src={request.documentUrl}
                  alt={`Disability certificate proof for ${request.vendorName}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {request.rejectionReason && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs">
                <span className="font-extrabold text-red-700 dark:text-red-300 block mb-1">Rejection Reason:</span>
                <p className="text-slate-700 dark:text-slate-300 italic">"{request.rejectionReason}"</p>
              </div>
            )}

            {/* Action Buttons: Approve vs Reject */}
            {request.status === 'pending' && (
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleConfirmApprove}
                  disabled={isProcessing}
                  className="flex-1 min-h-[48px] py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all focus:ring-2 focus:ring-emerald-500"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve & Grant Badge (AC-54)</span>
                </button>

                <button
                  onClick={() => setMode('reject_form')}
                  disabled={isProcessing}
                  className="min-h-[48px] px-4 py-3 rounded-2xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-extrabold text-xs hover:bg-red-200 transition-all"
                >
                  Reject...
                </button>
              </div>
            )}
          </div>
        )}

        {/* Mode 2: Rejection Reason Form */}
        {mode === 'reject_form' && (
          <form onSubmit={handleConfirmReject} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs space-y-1">
              <span className="font-extrabold text-amber-800 dark:text-amber-300">Rejecting Verification for {request.vendorName}</span>
              <p className="text-slate-600 dark:text-slate-400 leading-snug">
                Please provide specific feedback detailing why the document could not be verified (e.g. illegible certificate photo, invalid registration number).
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                Rejection Reason / Feedback (Required for AC-55)
              </label>
              <textarea
                required
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain the specific issue with the verification document..."
                className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-red-500 outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-1 min-h-[48px] py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs shadow-lg shadow-red-600/30 flex items-center justify-center space-x-1.5 transition-all"
              >
                <XCircle className="w-4 h-4" />
                <span>Confirm Rejection (AC-55)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('inspect')}
                className="min-h-[48px] px-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold text-xs"
              >
                Back to Inspection
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

