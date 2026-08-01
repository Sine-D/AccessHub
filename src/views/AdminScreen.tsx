import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { TopHeader } from '../components/layout/TopHeader';
import { BottomNav } from '../components/layout/BottomNav';
import { 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  XCircle 
} from 'lucide-react';

export const AdminScreen: React.FC = () => {
  const { speakText } = useAccessibility();
  const [verificationQueue, setVerificationQueue] = useState([
    { id: 'v1', name: 'Chamara Perera', type: 'Disability Certificate', status: 'Pending Verification', doc: 'Medical Board Cert #4521' },
    { id: 'v2', name: 'Hope Lanka NGO', type: 'NGO Charter', status: 'Pending Verification', doc: 'Reg #G-89512' }
  ]);

  const handleApprove = (id: string, name: string) => {
    setVerificationQueue(prev => prev.filter(item => item.id !== id));
    speakText(`Approved verification for ${name}. Badge granted.`);
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Mobile Monitoring Admin 🛡️" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg space-y-2 border border-slate-700">
          <div className="flex items-center space-x-2 text-teal-400 font-extrabold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Governance & Compliance</span>
          </div>
          <h3 className="font-extrabold text-base">AccessLink Verification Engine</h3>
          <p className="text-xs text-slate-300">
            Review disabled seller medical certificates and NGO credentials to maintain platform trust.
          </p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Sellers</span>
            <span className="text-lg font-extrabold text-blue-600 dark:text-blue-400 block">1,248</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Active NGOs</span>
            <span className="text-lg font-extrabold text-teal-600 dark:text-teal-400 block">42</span>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Fraud Score</span>
            <span className="text-lg font-extrabold text-emerald-500 block">0.01%</span>
          </div>
        </div>

        {/* Verification Queue */}
        <div className="space-y-2">
          <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
            Verification Approval Queue ({verificationQueue.length})
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
                      onClick={() => handleApprove(item.id, item.name)}
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

      </div>

      <BottomNav />

    </div>
  );
};
