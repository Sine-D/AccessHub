import React from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useAccessibility } from '../../hooks/useAccessibility';
import { mockProducts } from '../../services/mockData';
import { TopHeader } from '../../components/layout/TopHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import { 
  ShieldCheck, 
  Star, 
  MapPin, 
  TrendingUp, 
  Award, 
  Settings, 
  Edit3 
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { currentUser, setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="My Profile 👤" />

      <div className="space-y-4 pb-8">
        
        {/* Cover Image & Avatar Header */}
        <div className="relative">
          <img 
            src={currentUser.coverImage} 
            alt="cover" 
            className="w-full h-36 object-cover"
          />
          <div className="px-4 flex items-end justify-between -mt-10 relative z-10">
            <div className="relative">
              <img 
                src={currentUser.avatar} 
                alt={currentUser.name} 
                className="w-20 h-20 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl"
              />
              <span className="absolute bottom-0 right-0 bg-teal-500 text-white p-1 rounded-full text-xs shadow-md">
                ♿
              </span>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => setActiveScreen('settings')}
                className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-xs"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => speakText('Editing profile details')}
                className="px-3.5 py-2.5 rounded-2xl bg-blue-600 text-white font-extrabold text-xs shadow-md flex items-center space-x-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 space-y-1">
          <div className="flex items-center space-x-1.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">{currentUser.name}</h2>
            <ShieldCheck className="w-4 h-4 text-teal-500" />
          </div>
          <span className="text-xs font-bold text-teal-600 dark:text-teal-400 block">
            ♿ Verified Disability Badge: {currentUser.disabilityBadge}
          </span>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {currentUser.bio}
          </p>
          <div className="flex items-center space-x-3 text-xs font-bold text-slate-500 pt-1">
            <span className="flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{currentUser.location}</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-500">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{currentUser.rating} ({currentUser.reviewsCount} reviews)</span>
            </span>
          </div>
        </div>

        {/* Income Analytics Card */}
        <div className="px-4">
          <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-600 via-teal-600 to-emerald-600 text-white shadow-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">Total Sales & Earnings</span>
              <TrendingUp className="w-5 h-5 text-amber-300" />
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-extrabold">LKR {currentUser.totalEarnings?.toLocaleString()}</span>
              <span className="text-xs text-teal-200">({currentUser.totalOrders} Completed Orders)</span>
            </div>
            <div className="pt-2 border-t border-white/20 flex items-center justify-between text-[11px] font-bold">
              <span>Payout Status: Bank Direct Deposit Active</span>
              <span className="px-2 py-0.5 rounded-full bg-white/20">Monthly Auto-Transfer</span>
            </div>
          </div>
        </div>

        {/* User Active Listings */}
        <div className="px-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Active Products ({mockProducts.length})</h3>
            <button 
              onClick={() => setActiveScreen('marketplace')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              Add New
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {mockProducts.slice(0, 2).map((p) => (
              <div key={p.id} className="p-2.5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
                <img src={p.image} alt={p.title} className="w-full h-24 rounded-xl object-cover" />
                <h4 className="font-bold text-xs line-clamp-1">{p.title}</h4>
                <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">LKR {p.price.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Badges & Achievements */}
        <div className="px-4 space-y-2">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Inclusive Badges & Certifications</h3>
          <div className="flex space-x-2">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-2 flex-1">
              <Award className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Top Rated Seller</h4>
                <span className="text-[10px] text-slate-400">100+ Orders 5★</span>
              </div>
            </div>
            <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-2 flex-1">
              <ShieldCheck className="w-6 h-6 text-teal-500 shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Verified Disability</h4>
                <span className="text-[10px] text-slate-400">Ministry Approved</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <BottomNav />

    </div>
  );
};
