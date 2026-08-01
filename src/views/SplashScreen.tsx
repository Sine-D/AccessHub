import React, { useEffect } from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { Sparkles, ArrowRight, ShieldCheck, Accessibility } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  const { setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();

  useEffect(() => {
    speakText('AccessLink. Empowering Ability Through Inclusive Commerce.');
  }, []);

  return (
    <div className="w-full h-full min-h-[800px] bg-gradient-to-b from-slate-900 via-blue-950 to-slate-950 text-white flex flex-col items-center justify-between p-6 relative overflow-hidden select-none">
      
      {/* Background Decorative Glowing Orbs */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-600/30 blur-3xl"></div>
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-teal-500/20 blur-3xl"></div>
      
      {/* Top Tagline Badge */}
      <div className="pt-8 z-10">
        <div className="flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md">
          <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
          <span className="text-xs font-bold text-blue-200">
            Final Year Innovation Project
          </span>
        </div>
      </div>

      {/* Hero Logo & Slogan */}
      <div className="flex flex-col items-center text-center space-y-6 z-10 max-w-xs">
        
        {/* Animated Brand Logo Icon */}
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-teal-500 to-amber-500 p-1 shadow-2xl shadow-blue-500/40 animate-pulse">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
              <Accessibility className="w-12 h-12 text-teal-400 stroke-[2.5]" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-extrabold text-xs shadow-md border-2 border-slate-900">
            ♿
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            AccessLink
          </h1>
          <p className="text-sm font-medium text-slate-300 leading-snug">
            Inclusive Local Marketplace for Persons with Disabilities
          </p>
        </div>

        {/* Tagline */}
        <div className="py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-teal-300 italic">
          "Empowering Ability Through Inclusive Commerce."
        </div>

      </div>

      {/* Bottom Launch Button & Features Pill */}
      <div className="w-full space-y-4 pb-6 z-10">
        
        {/* Feature Pills */}
        <div className="flex items-center justify-center space-x-3 text-[11px] text-slate-400 font-semibold">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>WCAG AAA Ready</span>
          </span>
          <span>•</span>
          <span>Voice & AI Powered</span>
        </div>

        {/* Start Button */}
        <button
          onClick={() => {
            speakText('Navigating to Onboarding setup');
            setActiveScreen('onboarding');
          }}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-blue-500/30 hover:scale-[1.02] active:scale-98 transition-all flex items-center justify-center space-x-2"
        >
          <span>Explore Inclusive Marketplace</span>
          <ArrowRight className="w-5 h-5" />
        </button>

      </div>

    </div>
  );
};
