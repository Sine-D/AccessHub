import React from 'react';
import { useAppState, ScreenView } from '../context/AppStateContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { 
  Home, 
  ShoppingBag, 
  Wrench, 
  ShieldCheck, 
  User, 
  Plus 
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { 
    activeScreen, 
    setActiveScreen, 
    setSellModalOpen, 
    pendingServiceApplications, 
    userRole, 
    currentUser 
  } = useAppState();
  const { settings, speakText } = useAccessibility();

  // Integrated Authorization Check: Dedicated Admin Portal Navigation for ADMIN role
  const isAdmin = userRole === 'admin' || currentUser?.role === 'admin';

  const handleNavClick = (id: ScreenView, label: string) => {
    if (settings.screenReader) {
      speakText(`Navigated to ${label}`);
    }
    setActiveScreen(id);
  };

  if (isAdmin) {
    const adminNavItems: { id: ScreenView; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
      { id: 'admin', label: 'Admin Hub 🛡️', icon: ShieldCheck, badge: pendingServiceApplications.length },
      { id: 'profile', label: 'Admin Profile 👤', icon: User },
    ];

    return (
      <div className="sticky bottom-0 z-40 bg-slate-900 border-t border-slate-800 px-4 py-2.5 shadow-xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id, item.label)}
                className={`flex items-center space-x-2 py-2 px-4 rounded-xl font-bold text-xs transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4" />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[8px] flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const navItems: { id: ScreenView; label: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'marketplace', label: 'Shop', icon: ShoppingBag },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="sticky bottom-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 px-2 py-2 shadow-lg">
      <div className="flex items-center justify-around relative">
        
        {/* Left 2 Tabs (Home, Services) */}
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.label)}
              className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-2 rounded-2xl transition-all ${
                isActive 
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

        {/* Floating Action Button (FAB) in Center */}
        <div className="relative -top-4">
          <button
            onClick={() => {
              if (settings.screenReader) speakText('Open creation menu to register freelancer service or sell product');
              setSellModalOpen(true);
            }}
            aria-label="Register freelancer service or sell product"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-teal-600 to-blue-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/40 hover:scale-105 active:scale-95 transition-all ring-4 ring-white dark:ring-slate-900"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Right 3 Tabs (Shop, Admin, Profile) */}
        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id, item.label)}
              className={`flex flex-col items-center justify-center space-y-0.5 py-1 px-2 rounded-2xl transition-all ${
                isActive 
                  ? 'text-teal-600 dark:text-teal-400 font-bold scale-105' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[9px] flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}

      </div>
    </div>
  );
};
