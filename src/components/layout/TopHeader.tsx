import React from 'react';
import { useAppState } from '../../context/AppStateContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { Mic, Bell, Eye, Sparkles } from 'lucide-react';

interface TopHeaderProps {
  title?: string;
  showSearch?: boolean;
}

export const TopHeader: React.FC<TopHeaderProps> = ({ title, showSearch }) => {
  const { currentUser, setActiveScreen, unreadNotifications } = useAppState();
  const { speakText, settings, setAiModalOpen } = useAccessibility();

  const handleHeaderClick = (text: string) => {
    if (settings.screenReader) {
      speakText(text);
    }
  };

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-xs">
      <div className="flex items-center justify-between">
        
        {/* User Profile / Greeting */}
        <div 
          onClick={() => {
            handleHeaderClick(`Welcome back ${currentUser.name}`);
            setActiveScreen('profile');
          }}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="relative">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 group-hover:ring-blue-600 transition-all"
            />
            {currentUser.disabilityBadge && (
              <span 
                title={currentUser.disabilityBadge} 
                className="absolute -bottom-1 -right-1 bg-teal-500 text-white p-0.5 rounded-full ring-2 ring-white text-[10px]"
              >
                ♿
              </span>
            )}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {title || 'Ayubowan! 👋'}
            </span>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {currentUser.name.split(' ')[0]}
            </h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          
          {/* AI Voice Assistant Shortcut */}
          <button
            onClick={() => {
              handleHeaderClick('Opening Voice AI Assistant');
              setAiModalOpen(true);
            }}
            aria-label="Open Voice Assistant"
            className="p-2.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all flex items-center justify-center relative shadow-xs"
          >
            <Mic className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </button>

          {/* Notifications Icon */}
          <button
            onClick={() => {
              handleHeaderClick(`Notifications, ${unreadNotifications} unread`);
              setActiveScreen('notifications');
            }}
            aria-label="Notifications"
            className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-all relative"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-extrabold flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </button>

        </div>

      </div>
    </header>
  );
};
