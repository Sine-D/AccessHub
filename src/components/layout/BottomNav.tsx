import React from 'react';
import { useAppState, ScreenView } from '../../context/AppStateContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  Home, 
  ShoppingBag, 
  Briefcase, 
  MessageSquare, 
  User, 
  Plus 
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeScreen, setActiveScreen, setSellModalOpen, unreadNotifications } = useAppState();
  const { settings, speakText } = useAccessibility();

  const navItems: { id: ScreenView; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'marketplace', label: 'Marketplace', icon: ShoppingBag },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'chat', label: 'Messages', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const handleNavClick = (id: ScreenView, label: string) => {
    if (settings.screenReader) {
      speakText(`Navigated to ${label}`);
    }
    setActiveScreen(id);
  };

  return (
    <div className="sticky bottom-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-3 py-2">
      <div className="flex items-center justify-around relative">
        
        {/* Left 2 Tabs */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.label)}
              className={`flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-2xl transition-all ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Action Button (FAB) in Center */}
        <div className="relative -top-5">
          <button
            onClick={() => {
              if (settings.screenReader) speakText('Open creation menu to sell product or offer service');
              setSellModalOpen(true);
            }}
            aria-label="Sell product or offer service"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </div>

        {/* Right 3 Tabs */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.label)}
              className={`flex flex-col items-center justify-center space-y-1 py-1 px-2 rounded-2xl transition-all ${
                isActive 
                  ? 'text-blue-600 dark:text-blue-400 font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.id === 'chat' && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-500"></span>
                )}
              </div>
              <span className="text-[11px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

      </div>
    </div>
  );
};
