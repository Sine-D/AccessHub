import React, { useState } from 'react';
import { mockNotifications } from '../../services/mockData';
import { TopHeader } from '../../components/layout/TopHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import { 
  ShoppingBag, 
  Briefcase, 
  HeartHandshake 
} from 'lucide-react';

export const NotificationsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'orders' | 'jobs' | 'donations'>('all');

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Notifications 🔔" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-1">
          {(['all', 'orders', 'jobs', 'donations'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {mockNotifications.map((n) => {
            const Icon = n.type === 'order' ? ShoppingBag : n.type === 'job' ? Briefcase : HeartHandshake;
            return (
              <div 
                key={n.id}
                className={`p-3.5 rounded-3xl border transition-all flex items-start space-x-3 ${
                  !n.isRead 
                    ? 'bg-blue-50/60 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="p-2.5 rounded-2xl bg-blue-600 text-white shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{n.title}</h4>
                    <span className="text-[9px] text-slate-400 font-bold">{n.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {n.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      <BottomNav />

    </div>
  );
};
