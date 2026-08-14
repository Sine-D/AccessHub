import React, { useState } from 'react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { mockDonations } from '../../../mock/data';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { 
  Plus, 
  ShieldCheck, 
  CheckCircle2, 
  Heart 
} from 'lucide-react';

export const DonationScreen: React.FC = () => {
  const { speakText } = useAccessibility();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [donateSuccess, setDonateSuccess] = useState(false);

  const categories = ['All', 'Wheelchairs', 'Hearing Aids', 'Laptops', 'Medical Equipment', 'Food'];

  const handleDonate = (amount: number, title: string) => {
    setDonateSuccess(true);
    speakText(`Thank you! Your donation of LKR ${amount.toLocaleString()} for ${title} has been processed via escrow.`);
    setTimeout(() => setDonateSuccess(false), 2500);
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Inclusive Donation Hub ❤️" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-1.5 font-extrabold text-xs">
              <Heart className="w-4 h-4 fill-white" />
              <span>Support Persons with Disabilities</span>
            </div>
            <h3 className="font-extrabold text-base leading-tight">Donate Assistive Devices</h3>
            <p className="text-[11px] text-amber-100">100% verified campaigns with NGO escrows</p>
          </div>

          <button
            onClick={() => speakText('Opening item request form')}
            className="px-3 py-2 rounded-2xl bg-white text-slate-900 font-extrabold text-xs shadow-md shrink-0 flex items-center space-x-1 hover:bg-amber-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Request Gear</span>
          </button>
        </div>

        {/* Categories */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeCategory === c 
                  ? 'bg-amber-500 text-slate-950 font-extrabold' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Donation Cards */}
        <div className="space-y-4">
          {mockDonations.map((item) => {
            const percentage = Math.round((item.raisedAmount / item.targetAmount) * 100);
            return (
              <div 
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs"
              >
                {/* Header */}
                <div className="flex items-center space-x-3">
                  <img src={item.image} alt={item.title} className="w-20 h-20 rounded-2xl object-cover" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                        {item.category}
                      </span>
                      {item.ngoVerified && (
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center space-x-0.5">
                          <ShieldCheck className="w-3 h-3 text-teal-500" />
                          <span>NGO Verified</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white leading-tight line-clamp-2">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-900 dark:text-white">LKR {item.raisedAmount.toLocaleString()} raised</span>
                    <span className="text-slate-400">Goal: LKR {item.targetAmount.toLocaleString()} ({percentage}%)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.description}
                </p>

                {/* Action */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <img src={item.requesterAvatar} alt={item.requesterName} className="w-7 h-7 rounded-full object-cover" />
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.requesterName}</span>
                  </div>

                  <button
                    onClick={() => handleDonate(5000, item.title)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center space-x-1"
                  >
                    <Heart className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Donate LKR 5,000</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {donateSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center space-y-3 max-w-xs shadow-2xl">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Donation Processed! ❤️</h4>
              <p className="text-xs text-slate-500">Your contribution is stored safely in NGO Escrow until device delivery.</p>
            </div>
          </div>
        )}

      </div>

      <BottomNav />

    </div>
  );
};
