import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { TopHeader } from '../../components/layout/TopHeader';
import { BottomNav } from '../../components/layout/BottomNav';
import { 
  Accessibility, 
  Eye, 
  Volume2, 
  Mic, 
  Type, 
  Video, 
  Hand 
} from 'lucide-react';

export const AccessibilitySettingsScreen: React.FC = () => {
  const { settings, updateSettings, speakText } = useAccessibility();

  const handleToggle = (key: keyof typeof settings, label: string) => {
    const nextVal = !settings[key];
    updateSettings({ [key]: nextVal });
    speakText(`${label} toggled ${nextVal ? 'On' : 'Off'}`);
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col justify-between overflow-y-auto">
      
      <TopHeader title="Accessibility Control Panel ♿" />

      <div className="p-4 space-y-4 pb-8">
        
        {/* Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-700 via-teal-600 to-indigo-700 text-white shadow-lg space-y-1">
          <div className="flex items-center space-x-2">
            <Accessibility className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-sm">WCAG AAA Accessibility Suite</h3>
          </div>
          <p className="text-xs text-blue-100">
            Tailor AccessLink to fit your unique visual, auditory, mobility, or speech requirements.
          </p>
        </div>

        {/* Dynamic Font Scaling */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2">
            <Type className="w-5 h-5 text-blue-500" />
            <div>
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">Dynamic Font Scaling</h4>
              <span className="text-[10px] text-slate-400">Increase reading font size across all screens</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1">
            {[
              { scale: 'sm', label: 'Small 90%' },
              { scale: 'md', label: 'Normal 100%' },
              { scale: 'lg', label: 'Large 115%' },
              { scale: 'xl', label: 'Extra Large 130%' },
            ].map((f) => (
              <button
                key={f.scale}
                onClick={() => {
                  updateSettings({ fontScale: f.scale as any });
                  speakText(`Font scale set to ${f.label}`);
                }}
                className={`py-2 rounded-xl text-[10px] font-extrabold transition-all ${
                  settings.fontScale === f.scale 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {f.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Accessibility Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Visual Accessibility</h4>

          {[
            { key: 'highContrast', label: 'High Contrast Mode', desc: 'Black & Gold high contrast colors for low vision', icon: Eye },
            { key: 'darkMode', label: 'Dark Mode Theme', desc: 'Sleek dark background reducing eye strain', icon: Eye },
            { key: 'largeTapTargets', label: 'Large Tap Targets', desc: 'Enlarge buttons and touch targets to min 52px', icon: Hand },
          ].map((item) => {
            const Icon = item.icon;
            const isChecked = !!settings[item.key as keyof typeof settings];
            return (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-3 pr-2">
                  <Icon className="w-5 h-5 text-blue-500 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{item.label}</h5>
                    <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(item.key as any, item.label)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    isChecked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isChecked ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Auditory & Speech Accessibility Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-xs">
          <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">Screen Reader & Voice Controls</h4>

          {[
            { key: 'screenReader', label: 'Screen Reader Simulator', desc: 'Read screen text aloud using Web Speech API', icon: Volume2 },
            { key: 'voiceNavigation', label: 'Voice Command Navigation', desc: 'Navigate between tabs using spoken voice commands', icon: Mic },
            { key: 'signLanguageHelp', label: 'Sign Language Avatar Assistance', desc: 'Display sign language video translations for buttons', icon: Video },
            { key: 'oneHandMode', label: 'One-Handed Reachability Mode', desc: 'Shift interactive elements down for one-thumb reach', icon: Hand },
          ].map((item) => {
            const Icon = item.icon;
            const isChecked = !!settings[item.key as keyof typeof settings];
            return (
              <div key={item.key} className="flex items-center justify-between py-1">
                <div className="flex items-center space-x-3 pr-2">
                  <Icon className="w-5 h-5 text-teal-500 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">{item.label}</h5>
                    <span className="text-[10px] text-slate-400 block">{item.desc}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle(item.key as any, item.label)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    isChecked ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    isChecked ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
            );
          })}
        </div>

      </div>

      <BottomNav />

    </div>
  );
};
