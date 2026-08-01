import React, { useState } from 'react';
import { useAppState } from '../../hooks/useAppState';
import { useAccessibility } from '../../hooks/useAccessibility';
import { UserRole } from '../../types';
import { 
  User, 
  ShoppingBag, 
  Wrench, 
  Building2, 
  HeartHandshake, 
  Truck, 
  Fingerprint, 
  Mail, 
  Lock 
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { setActiveScreen, userRole, setUserRole } = useAppState();
  const { speakText, settings, updateSettings } = useAccessibility();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('kavindi.p@accesslink.lk');
  const [password, setPassword] = useState('••••••••');
  const [name, setName] = useState('Kavindi Perera');

  const roles: { id: UserRole; label: string; icon: React.FC<{ className?: string }>; desc: string }[] = [
    { id: 'disabled_seller', label: 'Disabled Seller', icon: ShoppingBag, desc: 'Sell handcrafted products' },
    { id: 'disabled_service', label: 'Service Provider', icon: Wrench, desc: 'Offer professional services' },
    { id: 'customer', label: 'Customer', icon: User, desc: 'Shop inclusive marketplace' },
    { id: 'company', label: 'Company', icon: Building2, desc: 'Post inclusive job openings' },
    { id: 'ngo', label: 'NGO / Charity', icon: HeartHandshake, desc: 'Manage donation campaigns' },
    { id: 'delivery', label: 'Delivery Partner', icon: Truck, desc: 'Deliver accessible orders' },
  ];

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    speakText(`Welcome to AccessLink! Logged in as ${name} with role ${userRole}`);
    setActiveScreen('home');
  };

  return (
    <div className="w-full h-full min-h-[800px] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col p-6 overflow-y-auto">
      
      {/* Brand Top Header */}
      <div className="text-center pt-2 pb-4 space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-teal-500 to-amber-500 text-white font-extrabold text-2xl flex items-center justify-center mx-auto shadow-md">
          A
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">AccessLink</h2>
        <p className="text-xs text-slate-500">Sign in to your inclusive account</p>
      </div>

      {/* Login vs Register Tabs */}
      <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-2xl mb-4">
        <button
          onClick={() => setAuthMode('login')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            authMode === 'login' 
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setAuthMode('register')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            authMode === 'register' 
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Register Account
        </button>
      </div>

      {/* Role Selection Grid */}
      <div className="space-y-2 mb-4">
        <label className="text-xs font-extrabold uppercase text-slate-400 block tracking-wider">
          Select Your Role (6 User Types)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = userRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setUserRole(r.id);
                  speakText(`Role selected: ${r.label}`);
                }}
                className={`p-2.5 rounded-2xl border text-left flex items-start space-x-2 transition-all ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="overflow-hidden">
                  <span className="text-[11px] font-bold block truncate">{r.label}</span>
                  <span className="text-[9px] text-slate-400 block leading-tight">{r.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Inputs */}
      <form onSubmit={handleAuthSubmit} className="space-y-3">
        
        {authMode === 'register' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {/* Accessibility Quick Preferences Box */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-2xl border border-blue-100 dark:border-blue-900 space-y-1.5">
          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 block">
            ♿ Quick Accessibility Preferences
          </span>
          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={() => updateSettings({ highContrast: !settings.highContrast })}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                settings.highContrast ? 'bg-amber-500 text-black' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              High Contrast
            </button>
            <button
              type="button"
              onClick={() => updateSettings({ fontScale: settings.fontScale === 'xl' ? 'md' : 'xl' })}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                settings.fontScale === 'xl' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-800'
              }`}
            >
              Extra Large Text
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 transition-all"
        >
          {authMode === 'login' ? 'Sign In to AccessLink' : 'Complete Registration'}
        </button>

      </form>

      {/* Alternative Logins */}
      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
        
        {/* Biometric Mock */}
        <button
          onClick={() => {
            speakText('Biometric authentication verified');
            setActiveScreen('home');
          }}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-center space-x-1.5 font-bold mr-1.5 hover:bg-slate-50"
        >
          <Fingerprint className="w-4 h-4 text-blue-500" />
          <span>Biometric ID</span>
        </button>

        {/* Google Mock */}
        <button
          onClick={() => {
            speakText('Google Single Sign-on successful');
            setActiveScreen('home');
          }}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-center space-x-1.5 font-bold ml-1.5 hover:bg-slate-50"
        >
          <span>🌐 Google</span>
        </button>

      </div>

    </div>
  );
};
