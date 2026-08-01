import React, { useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { mockProducts, mockServices, mockJobs, mockDonations } from '../mock/data';
import { TopHeader } from '../components/layout/TopHeader';
import { BottomNav } from '../components/layout/BottomNav';
import { 
  Search, 
  Mic, 
  MapPin, 
  Star, 
  Heart, 
  Sparkles, 
  Briefcase, 
  HeartHandshake, 
  SlidersHorizontal, 
  ChevronRight, 
  Accessibility,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { 
    setActiveScreen, 
    setSelectedProduct, 
    toggleWishlist, 
    wishlist,
    userRole 
  } = useAppState();

  const { speakText, settings, updateSettings, setAiModalOpen } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Crafts', icon: '🎨' },
    { name: 'Assistive Tech', icon: '♿' },
    { name: 'Services', icon: '🛠️' },
    { name: 'Adaptive Clothes', icon: '👕' },
    { name: 'Organic Food', icon: '🍵' },
  ];

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      {/* Header */}
      <TopHeader />

      {/* Main Scrollable Body */}
      <div className="p-4 space-y-5 pb-8">
        
        {/* Search Bar & Voice Search */}
        <div className="relative flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search products, services, or jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            onClick={() => setAiModalOpen(true)}
            aria-label="Voice Search"
            className="p-3 rounded-2xl bg-blue-600 text-white shadow-md hover:bg-blue-700 transition-all flex items-center justify-center shrink-0"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>

        {/* Accessibility Quick Settings Bar */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-3.5 rounded-3xl text-white shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Accessibility className="w-5 h-5 text-amber-300" />
              <h3 className="font-extrabold text-xs">Accessibility Quick Controls</h3>
            </div>
            <button
              onClick={() => setActiveScreen('a11y_settings')}
              className="text-[10px] font-bold underline text-blue-100"
            >
              All Settings
            </button>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pt-1">
            <button
              onClick={() => updateSettings({ highContrast: !settings.highContrast })}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                settings.highContrast ? 'bg-amber-400 text-black' : 'bg-white/20 text-white'
              }`}
            >
              High Contrast: {settings.highContrast ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => updateSettings({ fontScale: settings.fontScale === 'xl' ? 'md' : 'xl' })}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                settings.fontScale === 'xl' ? 'bg-amber-400 text-black' : 'bg-white/20 text-white'
              }`}
            >
              Extra Large Text
            </button>
            <button
              onClick={() => updateSettings({ screenReader: !settings.screenReader })}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                settings.screenReader ? 'bg-amber-400 text-black' : 'bg-white/20 text-white'
              }`}
            >
              Screen Reader TTS
            </button>
          </div>
        </div>

        {/* Quick Categories */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Categories</h3>
            <button 
              onClick={() => setActiveScreen('marketplace')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center space-x-0.5"
            >
              <span>See All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex space-x-3 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveScreen('marketplace')}
                className="px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shrink-0 flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-blue-500 shadow-xs"
              >
                <span className="text-base">{c.icon}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accessible Maps Shortcut Banner */}
        <div 
          onClick={() => setActiveScreen('map')}
          className="p-4 rounded-3xl bg-slate-900 text-white relative overflow-hidden shadow-xl cursor-pointer group"
        >
          <div className="absolute right-0 top-0 w-32 h-full bg-gradient-to-l from-blue-600/40 to-transparent pointer-events-none"></div>
          <div className="relative z-10 space-y-1">
            <div className="flex items-center space-x-2 text-teal-400 font-bold text-xs">
              <MapPin className="w-4 h-4" />
              <span>Interactive Local Map</span>
            </div>
            <h3 className="font-extrabold text-base leading-snug">
              Find Nearby Disabled Sellers & Wheelchair Accessible Transport
            </h3>
            <p className="text-[11px] text-slate-300">Explore sellers within 5km in Colombo</p>
          </div>
        </div>

        {/* Featured Products Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Featured Products</h3>
            <button 
              onClick={() => setActiveScreen('marketplace')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              View Marketplace
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {mockProducts.slice(0, 2).map((product) => (
              <div
                key={product.id}
                onClick={() => {
                  setSelectedProduct(product);
                  setActiveScreen('product_detail');
                }}
                className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-2 cursor-pointer hover:shadow-lg transition-all group relative"
              >
                {/* Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleWishlist(product.id);
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 backdrop-blur-md z-10 hover:scale-110"
                >
                  <Heart className={`w-3.5 h-3.5 ${wishlist.includes(product.id) ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* Product Image */}
                <div className="w-full h-32 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
                  <img 
                    src={product.image} 
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.disabilityBadge && (
                    <span className="absolute bottom-2 left-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500 text-white shadow-xs">
                      ♿ {product.disabilityBadge}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{product.category}</span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {product.title}
                  </h4>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                        LKR {product.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-0.5 text-[10px] font-bold text-amber-500">
                      <Star className="w-3 h-3 fill-amber-500" />
                      <span>{product.sellerRating}</span>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Job Spotlight */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Latest Job Openings</h3>
            <button 
              onClick={() => setActiveScreen('jobs')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              See All Jobs
            </button>
          </div>

          {mockJobs.slice(0, 1).map((job) => (
            <div 
              key={job.id}
              onClick={() => setActiveScreen('jobs')}
              className="p-3.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2 cursor-pointer hover:border-blue-500 shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <img src={job.companyLogo} alt={job.company} className="w-10 h-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">{job.title}</h4>
                    <span className="text-[11px] text-slate-500">{job.company} • {job.location}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded-full">
                  100% Remote
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{job.salary}</span>
                <span className="text-[10px] font-bold text-slate-400">Apply in 1 Tap</span>
              </div>
            </div>
          ))}
        </div>

        {/* Donation Spotlight */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Donation Hub Spotlight</h3>
            <button 
              onClick={() => setActiveScreen('donations')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400"
            >
              View Hub
            </button>
          </div>

          {mockDonations.slice(0, 1).map((d) => (
            <div 
              key={d.id}
              onClick={() => setActiveScreen('donations')}
              className="p-3.5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <img src={d.image} alt={d.title} className="w-16 h-16 rounded-2xl object-cover" />
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {d.category}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">{d.title}</h4>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full"
                      style={{ width: `${(d.raisedAmount / d.targetAmount) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                    <span>LKR {d.raisedAmount.toLocaleString()} raised</span>
                    <span>{Math.round((d.raisedAmount / d.targetAmount) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Navigation */}
      <BottomNav />

    </div>
  );
};
