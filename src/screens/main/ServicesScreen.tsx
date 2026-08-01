import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useAccessibility } from '../../hooks/useAccessibility';
import { mockServices } from '../../services/mockData';
import { TopHeader } from '../../components/layout/TopHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import { 
  Star, 
  Calendar, 
  CheckCircle2, 
  Wrench, 
  MessageSquare,
  ShieldCheck
} from 'lucide-react';

export const ServicesScreen: React.FC = () => {
  const { setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const handleBookService = (serviceTitle: string) => {
    setBookingSuccess(true);
    speakText(`Booking confirmed for ${serviceTitle}. Provider has been notified via AccessLink Messages.`);
    setTimeout(() => {
      setBookingSuccess(false);
      setActiveScreen('chat');
    }, 1800);
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Service Marketplace 🛠️" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg space-y-1">
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5" />
            <h3 className="font-extrabold text-sm">Inclusive Service Providers</h3>
          </div>
          <p className="text-xs text-teal-100">
            Hire verified disabled experts for UX audits, sign language translation, tailoring, and technical design.
          </p>
        </div>

        {/* Services List */}
        <div className="space-y-4">
          {mockServices.map((service) => (
            <div 
              key={service.id}
              className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs"
            >
              {/* Provider Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img src={service.providerAvatar} alt={service.providerName} className="w-12 h-12 rounded-full object-cover" />
                  <div>
                    <div className="flex items-center space-x-1">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white">{service.providerName}</h4>
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
                    </div>
                    <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400 block">
                      ♿ {service.disabilityBadge}
                    </span>
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
                {service.skills.map((skill, idx) => (
                  <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>

              {/* Portfolio Preview Images */}
              <div className="flex space-x-2 overflow-x-auto pt-1">
                {service.portfolioImages.map((img, i) => (
                  <img key={i} src={img} alt="portfolio" className="w-20 h-16 rounded-xl object-cover shrink-0" />
                ))}
              </div>

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
          ))}
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
