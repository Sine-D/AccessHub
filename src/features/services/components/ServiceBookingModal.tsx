import React, { useState, useEffect } from 'react';
import { ServiceItem, ServiceBookingRequest, ServiceMilestone } from '../../../core/types/models';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { useAppState } from '../../../core/hooks/useAppState';
import { 
  X, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  HelpCircle,
  FileText,
  Lock,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

interface ServiceBookingModalProps {
  service: ServiceItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmBooking?: (booking: ServiceBookingRequest) => void;
}

export const ServiceBookingModal: React.FC<ServiceBookingModalProps> = ({
  service,
  isOpen,
  onClose,
  onConfirmBooking
}) => {
  const { speakText } = useAccessibility();
  const { setActiveScreen, currentUser, addBookingRequest } = useAppState();

  const [projectTitle, setProjectTitle] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  
  // Payment option: '50_50' (50% upfront), 'full' (100% upfront)
  const [paymentOption, setPaymentOption] = useState<'50_50' | 'full'>('50_50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (service) {
      setProjectTitle(`${service.title} Task`);
      // Default delivery date: 3 days from now
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setDeliveryDate(defaultDate.toISOString().split('T')[0]);
    }
  }, [service]);

  if (!isOpen || !service) return null;

  const hourlyRate = service.hourlyRate || 4500;
  const totalBudget = estimatedHours * hourlyRate;

  let upfrontPercent = 50;
  if (paymentOption === 'full') upfrontPercent = 100;

  const upfrontDeposit = Math.round((totalBudget * upfrontPercent) / 100);
  const remainingBalance = totalBudget - upfrontDeposit;

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle.trim()) return;

    setIsSubmitting(true);

    const milestones: ServiceMilestone[] = [];
    if (paymentOption === 'full') {
      milestones.push({
        id: `m-1-${Date.now()}`,
        title: 'Full Work Completion & Escrow Release',
        percentage: 100,
        amount: totalBudget,
        status: 'pending_deposit',
        description: 'Entire project scope delivery and final client review.'
      });
    } else {
      milestones.push({
        id: `m-1-${Date.now()}`,
        title: `Initial Advance Escrow Deposit (${upfrontPercent}%)`,
        percentage: upfrontPercent,
        amount: upfrontDeposit,
        status: 'pending_deposit',
        description: 'Required upfront escrow deposit to begin work.'
      });
      milestones.push({
        id: `m-2-${Date.now()}`,
        title: `Final Deliverable Release (${100 - upfrontPercent}%)`,
        percentage: 100 - upfrontPercent,
        amount: remainingBalance,
        status: 'in_progress',
        description: 'Remaining payment released upon client review and approval of completed work.'
      });
    }

    const bookingRequest: ServiceBookingRequest = {
      id: `bk-${Date.now()}`,
      serviceId: service.id,
      serviceTitle: service.title,
      providerName: service.providerName,
      providerAvatar: service.providerAvatar,
      clientName: currentUser.name || 'Client',
      projectTitle,
      description,
      totalBudget,
      paymentType: paymentOption === 'full' ? 'full_upfront' : 'milestone',
      milestones,
      upfrontDeposit,
      remainingBalance,
      deliveryDate,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      speakText(`Booking request submitted for ${service.providerName}. Initial Escrow deposit of LKR ${upfrontDeposit.toLocaleString()} initiated.`);

      addBookingRequest(bookingRequest);
      if (onConfirmBooking) {
        onConfirmBooking(bookingRequest);
      }

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setActiveScreen('chat');
      }, 2000);
    }, 800);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-4">
            <img 
              src={service.providerAvatar} 
              alt={service.providerName} 
              className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-400 shadow-md" 
            />
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/30 inline-block mb-1">
                Verified Freelancer Booking
              </span>
              <h2 id="booking-modal-title" className="font-extrabold text-lg sm:text-xl text-white line-clamp-1">
                {service.providerName}
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                {service.title} • <span className="text-sky-400 font-bold">LKR {hourlyRate.toLocaleString()} / hr</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close booking modal"
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleBookingSubmit} className="p-5 sm:p-7 overflow-y-auto space-y-6 text-slate-900 dark:text-white">
          
          {/* Section 1: Project Details */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>1. Project & Task Details</span>
            </h3>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                Project Title / Brief <span className="text-rose-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="e.g. Video Editing & Accessible Subtitling Project"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300">
                Task Instructions & Requirements
              </label>
              <textarea 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed requirements, file links, specifications..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none resize-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span>Estimated Hours Needed</span>
                </label>
                <input 
                  type="number" 
                  min={1}
                  max={100}
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(Math.max(1, Number(e.target.value)))}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5 text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span>Target Delivery Date</span>
                </label>
                <input 
                  type="date" 
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Milestone & Escrow Payment Strategy */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>2. Escrow Payment Terms</span>
              </h3>
              <span className="text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
                🔒 Protected by Escrow
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Payments are safely deposited into Escrow and held securely. Funds are only released to the freelancer after you review and approve the completed task.
            </p>

            {/* Payment Options Selection - 50/50 Split & 100% Upfront ONLY */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <button
                type="button"
                onClick={() => setPaymentOption('50_50')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentOption === '50_50'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">50% / 50% Split</span>
                  {paymentOption === '50_50' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                  50% Upfront Deposit<br />50% Upon Delivery & Approval
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption('full')}
                className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                  paymentOption === 'full'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/40'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white">100% Upfront</span>
                  {paymentOption === 'full' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-tight">
                  Full Escrow Hold<br />Single Release on Completion
                </span>
              </button>
            </div>

            {/* Breakdown Visualizer Cards */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-3.5 shadow-inner border border-slate-800">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
                <span className="text-xs text-slate-400 font-semibold">Total Estimated Budget ({estimatedHours} hrs × LKR {hourlyRate.toLocaleString()})</span>
                <span className="text-base font-extrabold text-amber-400">LKR {totalBudget.toLocaleString()}</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Milestone 1 Card */}
                <div className="p-3 rounded-xl bg-slate-800/90 border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-xs">
                      M1
                    </div>
                    <div>
                      <p className="font-bold text-white">Initial Escrow Deposit ({upfrontPercent}%)</p>
                      <p className="text-[11px] text-emerald-400 font-semibold">💳 Due Now to start project</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-emerald-400 text-base">LKR {upfrontDeposit.toLocaleString()}</span>
                </div>

                {/* Milestone 2 Card (if milestone option) */}
                {paymentOption !== 'full' && (
                  <div className="p-3 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-full bg-slate-700 text-slate-300 flex items-center justify-center font-extrabold text-xs">
                        M2
                      </div>
                      <div>
                        <p className="font-bold text-white">Final Delivery Balance ({100 - upfrontPercent}%)</p>
                        <p className="text-[11px] text-slate-400 font-semibold">⏳ Pay after work is delivered & approved</p>
                      </div>
                    </div>
                    <span className="font-extrabold text-slate-300 text-base">LKR {remainingBalance.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* AccessHub Escrow Security Guarantee Note */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-3">
              <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-xs">AccessHub Escrow Protection Guarantee</p>
                <p className="text-[11px] opacity-90 leading-relaxed">
                  Your funds are securely locked in AccessHub Escrow. Payment will only be released to {service.providerName} once you verify and approve the final work.
                </p>
              </div>
            </div>
          </div>

          {/* Form Submit & Cancel Actions */}
          <div className="pt-3 flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3.5 rounded-2xl border border-slate-300 dark:border-slate-700 font-extrabold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              {isSubmitting ? (
                <span>Processing Escrow Deposit...</span>
              ) : (
                <>
                  <span>Confirm Deposit & Book</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>

        {/* Success Overlay */}
        {isSuccess && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center text-white">
            <div className="space-y-4 max-w-xs animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-lg">Booking Confirmed!</h4>
                <p className="text-xs text-emerald-300 font-semibold">
                  Initial Escrow Deposit of LKR {upfrontDeposit.toLocaleString()} is locked in Vault.
                </p>
                <p className="text-[11px] text-slate-400 pt-2">
                  Redirecting to AccessLink Messenger to send project brief to {service.providerName}...
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
