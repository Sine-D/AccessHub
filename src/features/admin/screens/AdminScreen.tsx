import React, { useState } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { 
  ShieldCheck, 
  CheckCircle2,
  Wrench,
  Star,
  MapPin,
  Phone,
  User,
  ExternalLink,
  Plus
} from 'lucide-react';

export const AdminScreen: React.FC = () => {
  const { 
    pendingServiceApplications, 
    approveServiceApplication, 
    rejectServiceApplication,
    setActiveScreen,
    setFreelancerModalOpen
  } = useAppState();

  const { speakText } = useAccessibility();

  const [activeTab, setActiveTab] = useState<'freelancers' | 'docs'>('freelancers');
  const [justApprovedName, setJustApprovedName] = useState<string | null>(null);

  const [verificationQueue, setVerificationQueue] = useState([
    { id: 'v1', name: 'Chamara Perera', type: 'Disability Certificate', status: 'Pending Verification', doc: 'Medical Board Cert #4521' },
    { id: 'v2', name: 'Hope Lanka NGO', type: 'NGO Charter', status: 'Pending Verification', doc: 'Reg #G-89512' }
  ]);

  const handleApproveDoc = (id: string, name: string) => {
    setVerificationQueue(prev => prev.filter(item => item.id !== id));
    speakText(`Approved verification for ${name}. Badge granted.`);
  };

  const handleApproveFreelancer = (id: string, name: string, serviceTitle: string) => {
    approveServiceApplication(id);
    setJustApprovedName(name);
    speakText(`OK confirmed! Approved freelancer application for ${name}. Published to Navbar Services.`);
    
    setTimeout(() => {
      setJustApprovedName(null);
    }, 4000);
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Admin Dashboard 🛡️" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Admin Header Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white shadow-xl space-y-2 border border-slate-700 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Management Hub</span>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Admin App
            </span>
          </div>

          <h3 className="font-extrabold text-base">Service Approvals & Verification Engine</h3>
          <p className="text-xs text-slate-300">
            Review freelancer applications (Name, District, Guardian, Phone, Rating, Images) and grant OK approval to publish to Navbar Services.
          </p>

          <div className="pt-1">
            <button
              onClick={() => setFreelancerModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold flex items-center space-x-1 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Register New Freelancer</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('freelancers')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'freelancers'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Freelancer Queue ({pendingServiceApplications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('docs')}
            className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'docs'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Medical Certs ({verificationQueue.length})</span>
          </button>
        </div>

        {/* Success Approval Notification Alert */}
        {justApprovedName && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>Approved <strong>{justApprovedName}</strong>! OK confirmed & added to Navbar Services.</span>
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

        {/* FREELANCER APPROVALS TAB */}
        {activeTab === 'freelancers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                Pending Freelancer Approvals ({pendingServiceApplications.length})
              </h3>
            </div>

            {pendingServiceApplications.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl text-center space-y-2 border border-slate-200 dark:border-slate-800 shadow-xs">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-xs">All Freelancer Applications Approved!</h4>
                <p className="text-[11px] text-slate-400">All submitted freelancers are live on the Services tab.</p>
                <button
                  onClick={() => setActiveScreen('services')}
                  className="px-4 py-2 rounded-xl bg-teal-600 text-white text-xs font-extrabold inline-flex items-center space-x-1"
                >
                  <span>Go to Navbar Services</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingServiceApplications.map((app) => (
                  <div key={app.id} className="p-4 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-md">
                    
                    {/* Header: Name, Age, Status */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{app.name}</h4>
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Age: {app.age}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 text-[11px] font-bold text-teal-600 dark:text-teal-400 pt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{app.district} District</span>
                          {app.disabilityBadge && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-extrabold">
                              ♿ {app.disabilityBadge}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Freelancer Status Tag */}
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        app.isFreelancer 
                          ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-300' 
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                      }`}>
                        {app.isFreelancer ? '✓ Freelancer (YES)' : 'Staff (NO)'}
                      </span>
                    </div>

                    {/* Service Offer Info */}
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                          {app.serviceTitle}
                        </span>
                        <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                          LKR {Number(app.hourlyRate).toLocaleString()} / hr
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                        {app.description}
                      </p>
                    </div>

                    {/* Contact & Guardian Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/40">
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[9px] block">Applicant Phone:</span>
                        <span className="font-extrabold text-slate-800 dark:text-amber-200 flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-amber-500" />
                          <span>{app.phone}</span>
                        </span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[9px] block">Guardian Details:</span>
                        <span className="font-bold text-slate-800 dark:text-amber-200 block truncate">
                          {app.guardianName || 'N/A'}
                        </span>
                        {app.guardianPhone && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                            {app.guardianPhone}
                          </span>
                        )}
                      </div>

                      {app.address && (
                        <div className="col-span-2 pt-1 border-t border-amber-200/50 dark:border-amber-900/40">
                          <span className="font-bold text-slate-400 uppercase text-[9px] block">Full Address:</span>
                          <span className="text-slate-700 dark:text-slate-300 font-medium">{app.address}</span>
                        </div>
                      )}
                    </div>

                    {/* Rating & Attached Rating Images */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-amber-500 font-extrabold text-xs">
                          <Star className="w-4 h-4 fill-amber-500" />
                          <span>Rating: {app.rating}.0 / 5.0</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {app.ratingImages.length} Proof Image(s)
                        </span>
                      </div>

                      {/* Images Gallery */}
                      {app.ratingImages.length > 0 && (
                        <div className="flex space-x-2 overflow-x-auto pt-0.5">
                          {app.ratingImages.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="Rating attachment proof"
                              className="w-16 h-14 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons: Approve (OK) vs Reject */}
                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => handleApproveFreelancer(app.id, app.name, app.serviceTitle)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Add to Navbar Services (OK)</span>
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

        {/* DOCUMENTS TAB */}
        {activeTab === 'docs' && (
          <div className="space-y-2">
            <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
              Medical & NGO Documents Queue ({verificationQueue.length})
            </h3>

            {verificationQueue.length === 0 ? (
              <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl text-center space-y-2 border border-slate-200 dark:border-slate-800">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-extrabold text-xs">All Verifications Cleared!</h4>
                <p className="text-[11px] text-slate-400">Queue is completely up to date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {verificationQueue.map((item) => (
                  <div key={item.id} className="p-3.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{item.name}</h4>
                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block">{item.type}</span>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                        {item.doc}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button
                        onClick={() => handleApproveDoc(item.id, item.name)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center space-x-1 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Badge</span>
                      </button>
                      <button
                        onClick={() => setVerificationQueue(prev => prev.filter(i => i.id !== item.id))}
                        className="py-2 px-3 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 font-extrabold text-xs"
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

      </div>

      <BottomNav />

    </div>
  );
};

