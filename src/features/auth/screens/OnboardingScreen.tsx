import React, { useState } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { 
  ShoppingBag, 
  Accessibility, 
  Volume2, 
  ChevronRight, 
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import onboardingImg from '../../../assets/images/Onboarding.png';

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
}

const slides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Inclusive Local Marketplace',
    subtitle: 'Empowering Ability Through Inclusive Commerce',
    description: 'Empowering persons with disabilities to showcase handcrafted goods, adaptive products, and offer freelance professional services across Sri Lanka.',
    badge: 'Disabled Sellers & Creators'
  },
  {
    id: 2,
    title: 'Accessible Services & Jobs',
    subtitle: 'Equal Opportunity Career & Service Hub',
    description: 'Connect with disability-confident employers, accessible remote jobs, and book sign language translators & accessibility WCAG auditors.',
    badge: 'Inclusive Talent & Remote Careers'
  },
  {
    id: 3,
    title: 'Barrier-Free Voice & Ramp Maps',
    subtitle: 'WCAG AAA Accessibility Suite',
    description: 'Experience built-in AI Voice Assistant, screen reader simulator, text-to-speech, and crowd-sourced accessible ramp location maps.',
    badge: '100% Barrier-Free Navigation'
  }
];

export const OnboardingScreen: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextIndex = currentSlide + 1;
      setCurrentSlide(nextIndex);
      speakText(`${slides[nextIndex].title}. ${slides[nextIndex].description}`);
    } else {
      speakText('Welcome to AccessHub Sign Up & Login.');
      setActiveScreen('auth');
    }
  };

  const current = slides[currentSlide];

  return (
    <div className="w-full h-full min-h-[800px] bg-white text-slate-900 flex flex-col justify-between p-6 select-none animate-fadeIn">
      
      {/* Center Onboarding Hero Illustration & Text */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto max-w-sm mx-auto">
        
        {/* Onboarding Image Frame */}
        <div className="relative w-full max-w-xs h-64 sm:h-72 rounded-3xl overflow-hidden bg-white p-2 flex items-center justify-center transition-transform duration-500">
          <img 
            src={onboardingImg} 
            alt="AccessHub Onboarding"
            className="w-full h-full object-contain filter drop-shadow-md"
          />
        </div>

        {/* Title & Description Content */}
        <div className="space-y-3 px-2 w-full">
          <span className="text-[11px] font-bold text-teal-600 bg-teal-50 border border-teal-100 px-3 py-0.5 rounded-full inline-block">
            {current.badge}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {current.title}
          </h2>
          <h3 className="text-xs font-semibold text-slate-500">
            {current.subtitle}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed pt-1 max-w-xs mx-auto">
            {current.description}
          </p>

          {/* Action Button Directly Below Paragraph */}
          <div className="pt-3.5 w-[85%] max-w-[280px] mx-auto">
            <button
              onClick={handleNext}
              className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 flex items-center justify-center space-x-2 transition-all"
            >
              <span>{currentSlide === slides.length - 1 ? '🚀 Get Started Now' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
