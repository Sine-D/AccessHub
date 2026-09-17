import React, { useState } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { TopHeader } from '../../../core/navigation/TopHeader';
import { BottomNav } from '../../../core/navigation/BottomNav';
import { 
  Star, 
  Calendar, 
  CheckCircle2, 
  Wrench, 
  MessageSquare,
  ShieldCheck,
  Plus,
  Search
} from 'lucide-react';

const CATEGORIES = ['All', 'HandCraft', 'Designing', 'Development', 'Translation'];

export const ServicesScreen: React.FC = () => {
  const { servicesList, setActiveScreen, setFreelancerModalOpen } = useAppState();
  const { speakText } = useAccessibility();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBookService = (serviceTitle: string) => {
    setBookingSuccess(true);
    speakText(`Booking confirmed for ${serviceTitle}. Provider has been notified via AccessLink Messages.`);
    setTimeout(() => {
      setBookingSuccess(false);
      setActiveScreen('chat');
    }, 1800);
  };

  const filteredServices = servicesList.filter((service) => {
    // Category Pill Filter
    if (selectedCategory !== 'All') {
      const cat = selectedCategory.toLowerCase();
      const serviceCat = service.category?.toLowerCase() || '';
      const serviceTitle = service.title?.toLowerCase() || '';
      const serviceDesc = service.description?.toLowerCase() || '';
      const serviceSkills = (service.skills || []).map(s => s.toLowerCase());

      let matchCategory = false;

      if (cat === 'handcraft') {
        matchCategory = serviceCat.includes('handcraft') || serviceCat.includes('craft') || serviceCat.includes('handbag') || serviceCat.includes('tailor') ||
                        serviceTitle.includes('handcraft') || serviceTitle.includes('craft') || serviceTitle.includes('making') || serviceTitle.includes('handbag') || serviceTitle.includes('tailor') ||
                        serviceDesc.includes('craft') || serviceDesc.includes('hand') ||
                        serviceSkills.some(s => s.includes('craft') || s.includes('hand') || s.includes('making') || s.includes('tailor'));
      } else if (cat === 'designing') {
        matchCategory = serviceCat.includes('design') || 
                        serviceTitle.includes('design') || serviceTitle.includes('ux') || serviceTitle.includes('ui') || serviceTitle.includes('graphic') ||
                        serviceDesc.includes('design') || serviceDesc.includes('ux') ||
                        serviceSkills.some(s => s.includes('design') || s.includes('ux') || s.includes('ui'));
      } else if (cat === 'development') {
        matchCategory = serviceCat.includes('dev') || serviceCat.includes('code') || serviceCat.includes('software') || serviceCat.includes('web') ||
                        serviceTitle.includes('dev') || serviceTitle.includes('code') || serviceTitle.includes('software') || serviceTitle.includes('web') || serviceTitle.includes('tech') ||
                        serviceDesc.includes('dev') || serviceDesc.includes('code') || serviceDesc.includes('software') ||
                        serviceSkills.some(s => s.includes('dev') || s.includes('code') || s.includes('web') || s.includes('react') || s.includes('software') || s.includes('tech'));
      } else if (cat === 'translation') {
        matchCategory = serviceCat.includes('transla') || serviceCat.includes('sign') || serviceCat.includes('language') || serviceCat.includes('interpret') ||
                        serviceTitle.includes('transla') || serviceTitle.includes('sign') || serviceTitle.includes('language') || serviceTitle.includes('interpret') || serviceTitle.includes('braille') ||
                        serviceDesc.includes('transla') || serviceDesc.includes('sign') || serviceDesc.includes('language') ||
                        serviceSkills.some(s => s.includes('transla') || s.includes('sign') || s.includes('language') || s.includes('braille') || s.includes('interpreter'));
      } else {
        matchCategory = serviceCat.includes(cat) || serviceTitle.includes(cat) || serviceDesc.includes(cat) || serviceSkills.some(s => s.includes(cat));
      }

      if (!matchCategory) return false;
    }

    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchTitle = service.title.toLowerCase().includes(q);
    const matchProvider = service.providerName.toLowerCase().includes(q);
    const matchDesc = service.description.toLowerCase().includes(q);
    const matchSkills = service.skills.some((s: string) => s.toLowerCase().includes(q));
    const matchDistrict = service.availability ? service.availability.toLowerCase().includes(q) : false;
    const matchBadge = service.disabilityBadge ? service.disabilityBadge.toLowerCase().includes(q) : false;
    return matchTitle || matchProvider || matchDesc || matchSkills || matchDistrict || matchBadge;
  });

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Service Marketplace 🛠️" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Banner with Register Freelancer Action */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800 text-white shadow-lg space-y-2 border border-teal-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-teal-200" />
              <h3 className="font-extrabold text-sm">Inclusive Service Marketplace</h3>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              Navbar Services
            </span>
          </div>

          <p className="text-xs text-teal-100 leading-snug">
            Hire verified disabled experts for UX audits, sign language translation, tailoring, and technical design.
          </p>

          <div className="pt-1 flex items-center justify-between">
            <button
              onClick={() => {
                speakText('Opening Freelancer Registration Form');
                setFreelancerModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-white text-teal-800 font-extrabold text-xs shadow-md hover:bg-teal-50 flex items-center space-x-1.5 transition-all"
            >
              <Plus className="w-4 h-4 text-teal-700" />
              <span>Register as Freelancer Form</span>
            </button>

            <span className="text-[10px] font-semibold text-teal-200">
              {filteredServices.length} Providers Found
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
          <input
            type="text"
            placeholder="Search services, skills, provider names, Colombo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 outline-none shadow-xs"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  speakText(`Filter by ${cat}`);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1 border ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600 shadow-md'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-extrabold text-sm text-slate-700 dark:text-slate-300">No services found matching "{searchQuery}"</p>
              <p className="text-xs text-slate-400">Try searching for other keywords like "UX", "Braille", "Design", or provider names.</p>
            </div>
          ) : (
            filteredServices.map((service) => (
            <div 
              key={service.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-sm hover:border-teal-500 transition-all"
            >
              {/* Provider Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={service.providerAvatar} alt={service.providerName} className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/20" />
                  <div>
                    <div className="flex items-center space-x-1">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{service.providerName}</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                    </div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 block">
                      ♿ {service.disabilityBadge}
                    </span>
                    {service.availability && (
                      <span className="text-[9px] text-slate-400 font-medium block">
                        📍 {service.availability}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="font-extrabold text-sm text-blue-600 dark:text-blue-400">
                    LKR {service.hourlyRate.toLocaleString()} / hr
                  </span>
                  <div className="flex items-center justify-end space-x-0.5 text-[10px] font-bold text-amber-500">
                    <Star className="w-3 h-3 fill-amber-500" />
                    <span>{service.rating} ({service.reviewsCount})</span>
                  </div>
                </div>
              </div>

              {/* Title & Desc */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{service.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {service.description}
                </p>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5">
                {service.skills.map((skill: string, idx: number) => (
                  <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-teal-50 dark:bg-slate-700 text-teal-700 dark:text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>

              {/* Portfolio Preview Images */}
              {service.portfolioImages && service.portfolioImages.length > 0 && (
                <div className="flex space-x-2 overflow-x-auto pt-1">
                  {service.portfolioImages.map((img: string, i: number) => (
                    <img key={i} src={img} alt="portfolio" className="w-20 h-16 rounded-xl object-cover shrink-0 border border-slate-100 dark:border-slate-700" />
                  ))}
                </div>
              )}

              {/* Booking Action */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setActiveScreen('chat')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1"
                >
                  <MessageSquare className="w-4 h-4 text-blue-500" />
                  <span>Chat Provider</span>
                </button>

                <button
                  onClick={() => handleBookService(service.title)}
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold shadow-md flex items-center justify-center space-x-1"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Service</span>
                </button>
              </div>

            </div>
          )))}
        </div>

        {bookingSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 text-center space-y-3 max-w-xs shadow-2xl">
              <CheckCircle2 className="w-12 h-12 text-teal-500 mx-auto animate-bounce" />
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Booking Confirmed!</h4>
              <p className="text-xs text-slate-500">Redirecting to Messenger Chat to discuss date & requirements...</p>
            </div>
          </div>
        )}

      </div>

      <BottomNav />

    </div>
  );
};

