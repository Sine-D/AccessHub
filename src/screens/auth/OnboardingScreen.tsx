import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useAccessibility } from '../../hooks/useAccessibility';
import { 
  ShoppingBag, 
  Accessibility, 
  Briefcase, 
  HeartHandshake, 
  ChevronRight, 
  Volume2 
} from 'lucide-react';

interface Slide {
  title: string;
  subtitle: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  color: string;
  badge: string;
  image: string;
}

const slides: Slide[] = [
  {
    title: 'Inclusive Commerce',
    subtitle: 'Marketplace Built For Everyone',
    description: 'Empowering persons with disabilities to sell handcrafted goods, offer professional services, and earn independent income.',
    icon: ShoppingBag,
    color: 'from-blue-600 to-indigo-600',
    badge: 'Disabled Sellers & Creators',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: 'Accessible Services',
    subtitle: 'Services & Freelance Talent',
    description: 'Book verified disabled service providers for web accessibility audits, sign language translation, tailoring, and creative arts.',
    icon: Accessibility,
    color: 'from-teal-500 to-emerald-600',
    badge: 'Inclusive Talent',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: 'AI & Assistive Tech',
    subtitle: 'Voice, Vision & Screen Reader',
    description: 'First app with built-in voice assistant, speech-to-text, sign language video guides, and dynamic font scaling.',
    icon: Volume2,
    color: 'from-amber-500 to-orange-600',
    badge: 'WCAG AAA Accessibility',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=600'
  },
  {
    title: 'Jobs & Donation Hub',
    subtitle: 'Connect with NGOs & Companies',
    description: 'Apply for 100% remote accessible jobs or donate wheelchairs, hearing aids, and medical gear directly to verified individuals.',
    icon: HeartHandshake,
    color: 'from-purple-600 to-pink-600',
    badge: 'NGO & Corporate Partners',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600'
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
      speakText('Onboarding complete. Proceeding to Authentication.');
      setActiveScreen('auth');
    }
  };

  const current = slides[currentSlide];
  const Icon = current.icon;

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between p-6">
      
      {/* Top Header Controls */}
      <div className="flex items-center justify-between pt-2">
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
          Step {currentSlide + 1} of 4
        </span>
        <button
          onClick={() => {
            speakText('Skipping onboarding');
            setActiveScreen('auth');
          }}
          className="text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-white"
        >
          Skip
        </button>
      </div>

      {/* Main Slide Card */}
      <div className="flex flex-col items-center text-center space-y-6 my-auto">
        
        {/* Slide Image */}
        <div className="relative w-full max-w-xs h-56 rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-800">
          <img 
            src={current.image} 
            alt={current.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4">
            <span className="text-[11px] font-bold text-white bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/30">
              {current.badge}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2 max-w-xs">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Icon className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {current.title}
          </h2>
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            {current.subtitle}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {current.description}
          </p>
        </div>

      </div>

      {/* Bottom Controls & Progress Dots */}
      <div className="space-y-4 pb-4">
        
        {/* Progress Dots */}
        <div className="flex items-center justify-center space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2.5 rounded-full transition-all ${
                currentSlide === index 
                  ? 'w-8 bg-blue-600' 
                  : 'w-2.5 bg-slate-300 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2 transition-all"
        >
          <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>

      </div>

    </div>
  );
};
