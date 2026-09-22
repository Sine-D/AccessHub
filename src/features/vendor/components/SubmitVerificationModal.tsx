import React, { useState } from 'react';
import { X, ShieldCheck, Upload, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { submitVendorVerification } from '../../../services/vendorVerificationService';
import { SRI_LANKA_DISTRICTS } from '../../../mock/data';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { useAppState } from '../../../core/hooks/useAppState';

interface SubmitVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

export const SubmitVerificationModal: React.FC<SubmitVerificationModalProps> = ({
  isOpen,
  onClose,
  onSubmitted,
}) => {
  const { settings, speakText } = useAccessibility();
  const { currentUser } = useAppState();

  const [vendorName, setVendorName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState('+94 77 000 0000');
  const [district, setDistrict] = useState('Colombo');
  const [businessType, setBusinessType] = useState<'artisan' | 'service_provider' | 'ngo' | 'company'>('artisan');
  const [documentType, setDocumentType] = useState<'disability_certificate' | 'medical_board_cert' | 'ngo_charter' | 'national_id'>('medical_board_cert');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentUrl, setDocumentUrl] = useState('https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=800');
  const [disabilityBadge, setDisabilityBadge] = useState('Wheelchair User');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !email.trim() || !documentNumber.trim()) {
      setError('Please fill in all required fields (Vendor Name, Email, Document #).');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await submitVendorVerification({
        userId: currentUser?.id || 'u-vendor-new',
        vendorName: vendorName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        district,
        businessType,
        documentType,
        documentNumber: documentNumber.trim(),
        documentUrl: documentUrl.trim(),
        disabilityBadge: disabilityBadge.trim(),
        guardianName: guardianName.trim() || undefined,
        guardianPhone: guardianPhone.trim() || undefined,
      });

      setIsSuccess(true);
      speakText('Verification request submitted successfully to Admin Dashboard.');

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSubmitted) onSubmitted();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Failed to submit verification request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-5 space-y-4 shadow-2xl relative my-auto border ${
          settings.highContrast
            ? 'bg-black text-white border-yellow-300'
            : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800'
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-teal-500" />
            <h3 id="submit-modal-title" className="font-extrabold text-sm sm:text-base">
              Submit Vendor Verification Request (AC-52)
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close verification request form"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white font-extrabold flex items-center justify-center transition-all focus:ring-2 focus:ring-teal-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
              Request Submitted to Admin! 🎉
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
              Your disability documentation and vendor details have been sent to the Admin Review Queue.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            {error && (
              <div
                role="alert"
                className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60 border border-red-200 text-red-700 dark:text-red-300 text-xs font-bold flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Vendor / Business Name *</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">District *</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {SRI_LANKA_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Type *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="medical_board_cert">Medical Board Cert</option>
                  <option value="disability_certificate">Disability ID Card</option>
                  <option value="ngo_charter">NGO Registration Charter</option>
                  <option value="national_id">National ID Card</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document / Reg # *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MBC-COL-4521"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Requested Disability Badge *</label>
              <input
                type="text"
                required
                placeholder="e.g. Wheelchair User, Visually Impaired Creator"
                value={disabilityBadge}
                onChange={(e) => setDisabilityBadge(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Document Proof Image URL</label>
              <input
                type="text"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none font-mono text-[11px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[48px] py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 transition-all mt-2 focus:ring-2 focus:ring-teal-500"
            >
              {isSubmitting ? 'Submitting Request...' : 'Submit Verification Request (AC-52)'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

