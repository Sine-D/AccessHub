import React from 'react';
import { useAppState } from '../context/AppStateContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { TopHeader } from '../components/layout/TopHeader';
import { BottomNav } from '../components/layout/BottomNav';
import { 
  Accessibility, 
  Bell, 
  Globe, 
  Lock, 
  HelpCircle, 
  Info, 
  ChevronRight, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';

export const SettingsScreen: React.FC = () => {
  const { setActiveScreen } = useAppState();
  const { speakText } = useAccessibility();

  const menu = [
    { label: 'Accessibility Control Panel', desc: 'Font scale, high contrast, screen reader', screen: 'a11y_settings', icon: Accessibility, badge: 'WCAG AAA' },
    { label: 'Notifications & Alerts', desc: 'Push, voice, and order alerts', screen: 'notifications', icon: Bell },
    { label: 'Language & Translation', desc: 'English, Sinhala, Tamil, Sign Language', screen: 'settings', icon: Globe },
    { label: 'Privacy & Escrow Security', desc: '256-bit encryption & data control', screen: 'settings', icon: Lock },
    { label: 'Help & Disability Support Hub', desc: '24/7 sign language support hotline', screen: 'settings', icon: HelpCircle },
    { label: 'About AccessLink FYP', desc: 'Version 1.0.0 (University Final Year Project)', screen: 'settings', icon: Info },
  ];

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="App Settings ⚙️" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Menu Items */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden shadow-xs">
          {menu.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  speakText(`Opening ${item.label}`);
                  setActiveScreen(item.screen as any);
                }}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{item.label}</h4>
                    <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {item.badge && (
                    <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500 text-white">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Log out */}
        <button
          onClick={() => {
            speakText('Signed out of AccessLink');
            setActiveScreen('auth');
          }}
          className="w-full py-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold text-xs flex items-center justify-center space-x-2 hover:bg-red-100"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>

      </div>

      <BottomNav />

    </div>
  );
};
