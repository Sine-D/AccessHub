import React from 'react';
import { useAppState, ScreenView } from '../../context/AppStateContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { 
  Smartphone, 
  Monitor, 
  Volume2, 
  Eye, 
  Moon, 
  Sun, 
  Layers,
  Sparkles
} from 'lucide-react';

interface DeviceFrameProps {
  children: React.ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  const { 
    deviceFrame, 
    setDeviceFrame, 
    activeScreen, 
    setActiveScreen
  } = useAppState();

  const { 
    settings, 
    updateSettings, 
    speakText, 
    stopSpeaking,
    setAiModalOpen
  } = useAccessibility();

  const screensList: { id: ScreenView; label: string }[] = [
    { id: 'splash', label: '1. Splash Screen' },
    { id: 'onboarding', label: '2. Onboarding (4 Steps)' },
    { id: 'auth', label: '3. Auth & Role Selector' },
    { id: 'home', label: '4. Home Dashboard' },
    { id: 'marketplace', label: '5. Marketplace' },
    { id: 'product_detail', label: '6. Product Details' },
    { id: 'services', label: '7. Service Marketplace' },
    { id: 'jobs', label: '8. Job Portal' },
    { id: 'donations', label: '9. Donation Hub' },
    { id: 'map', label: '10. Accessible Maps' },
    { id: 'chat', label: '11. Messenger Chat' },
    { id: 'profile', label: '12. User Profile' },
    { id: 'settings', label: '13. App Settings' },
    { id: 'a11y_settings', label: '14. Accessibility Settings' },
    { id: 'order_tracking', label: '15. Order Tracking Timeline' },
    { id: 'payment', label: '16. Checkout & Payment' },
    { id: 'notifications', label: '17. Notifications Hub' },
    { id: 'admin', label: '18. Mobile Admin Dashboard' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start selection:bg-blue-600">
      
      {/* Top Presentation & Accessibility Control Bar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Slogan */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-teal-500 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="font-extrabold text-white text-xl">A</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                  AccessLink
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  FYP High-Fidelity UI
                </span>
              </div>
              <p className="text-xs text-slate-400">Empowering Ability Through Inclusive Commerce</p>
            </div>
          </div>

          {/* Quick View Navigator */}
          <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
            <Layers className="w-4 h-4 text-blue-400 ml-1" />
            <select
              value={activeScreen}
              onChange={(e) => setActiveScreen(e.target.value as ScreenView)}
              className="bg-transparent text-xs font-semibold text-slate-200 outline-none cursor-pointer pr-2"
            >
              {screensList.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Accessibility Quick Toggles */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Screen Reader Voice Simulator */}
            <button
              onClick={() => {
                const nextState = !settings.screenReader;
                updateSettings({ screenReader: nextState });
                if (nextState) {
                  speakText('Screen Reader Simulator Activated. Tap elements to hear text read aloud.');
                } else {
                  stopSpeaking();
                }
              }}
              title="Toggle Screen Reader Voice Simulation"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.screenReader 
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/30 animate-pulse' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{settings.screenReader ? 'TTS Active' : 'Screen Reader'}</span>
            </button>

            {/* High Contrast Mode */}
            <button
              onClick={() => updateSettings({ highContrast: !settings.highContrast })}
              title="Toggle WCAG High Contrast"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                settings.highContrast
                  ? 'bg-yellow-400 text-slate-950 font-bold border border-yellow-300'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>High Contrast</span>
            </button>

            {/* Font Scaling Toggle */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              {(['md', 'lg', 'xl'] as const).map((scale) => (
                <button
                  key={scale}
                  onClick={() => updateSettings({ fontScale: scale })}
                  className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                    settings.fontScale === scale 
                      ? 'bg-blue-600 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {scale === 'md' ? 'A' : scale === 'lg' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>

            {/* Dark/Light mode toggle */}
            <button
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              title="Toggle Light/Dark Theme"
            >
              {settings.darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />}
            </button>

            {/* AI Assistant Modal Button */}
            <button
              onClick={() => setAiModalOpen(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-teal-500 to-blue-600 text-white shadow-md hover:opacity-90"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Hub</span>
            </button>

            {/* Frame Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 ml-2">
              <button
                onClick={() => setDeviceFrame('iphone')}
                className={`p-1.5 rounded ${deviceFrame === 'iphone' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                title="iPhone Mobile View"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceFrame('fullscreen')}
                className={`p-1.5 rounded ${deviceFrame === 'fullscreen' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                title="Responsive Fullscreen View"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex items-center justify-center p-2 sm:p-6 overflow-y-auto">
        {deviceFrame === 'fullscreen' ? (
          <div className="w-full max-w-md mx-auto min-h-[844px] bg-slate-50 dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 relative">
            {children}
          </div>
        ) : (
          /* iPhone / Android Mock Frame */
          <div className="relative w-[390px] h-[844px] bg-slate-900 rounded-[50px] p-3 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border-[6px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col transition-all">
            
            {/* Dynamic Island / Notch */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-full z-50 flex items-center justify-between px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-900/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              </div>
              <div className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800"></div>
            </div>

            {/* Status Bar */}
            <div className="w-full h-8 flex items-center justify-between px-6 pt-1 text-[12px] font-bold text-slate-800 dark:text-slate-100 select-none z-40">
              <span>9:41</span>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-mono">5G</span>
                <div className="w-5 h-2.5 rounded-sm border border-current p-0.5 flex items-center">
                  <div className="h-full w-4/5 bg-emerald-500 rounded-xs"></div>
                </div>
              </div>
            </div>

            {/* Inner Phone Screen Content */}
            <div className="w-full flex-1 bg-slate-50 dark:bg-slate-900 rounded-[38px] overflow-hidden relative flex flex-col shadow-inner">
              {children}
            </div>

            {/* Home Indicator Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-36 h-1 bg-slate-600 dark:bg-slate-400 rounded-full z-50"></div>
          </div>
        )}
      </main>
    </div>
  );
};
