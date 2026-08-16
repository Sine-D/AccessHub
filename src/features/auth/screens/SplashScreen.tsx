import React, { useEffect } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import accessHubLogo from '../../../assets/images/access_hub_logo.png';

export const SplashScreen: React.FC = () => {
  const { setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();

  useEffect(() => {
    speakText('Welcome to Access Hub');

    const timer = setTimeout(() => {
      setActiveScreen('onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      onClick={() => setActiveScreen('onboarding')}
      className="w-full h-full min-h-[800px] bg-white flex items-center justify-center p-6 relative overflow-hidden select-none cursor-pointer"
    >
      {/* Centered Prominent Large Access Hub Logo */}
      <div className="relative z-10 flex items-center justify-center p-2 transition-transform duration-500 hover:scale-105">
        <img 
          src={accessHubLogo} 
          alt="Access Hub Logo"
          className="w-80 h-80 sm:w-[420px] sm:h-[420px] object-contain"
        />
      </div>

    </div>
  );
};
