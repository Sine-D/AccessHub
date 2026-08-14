import React, { useState } from 'react';
import { useAppState } from '../../../core/hooks/useAppState';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { UserRole } from '../../../core/types';
import signupLoginImg from '../../../assets/images/signup_login.jpg';
import { 
  User, 
  ShoppingBag, 
  Wrench, 
  Building2, 
  HeartHandshake, 
  Truck, 
  Fingerprint, 
  Mail, 
  Lock,
  UserPlus,
  LogIn,
  Compass,
  ArrowLeft
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { setActiveScreen, userRole, setUserRole } = useAppState();
  const { speakText, settings, updateSettings } = useAccessibility();

  const [authView, setAuthView] = useState<'selection' | 'form'>('selection');
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
    speakText(`Welcome to AccessHub! Logged in as ${name}`);
    setActiveScreen('home');
  };

  // 1. CLEAN WHITE AUTH SELECTION SCREEN (signup&login.jpg + Create Account & Log In Buttons)
  if (authView === 'selection') {
    return (
      <div className="w-full h-full min-h-[800px] bg-white text-slate-900 flex flex-col justify-between p-6 select-none animate-fadeIn">
        
        {/* Center Hero Illustration & Headline */}
        <div className="flex flex-col items-center text-center space-y-5 my-auto max-w-sm mx-auto">
          
          {/* signup&login.jpg Illustration Container */}
          <div className="relative w-full max-w-xs h-64 sm:h-72 rounded-3xl overflow-hidden bg-white p-2 flex items-center justify-center">
            <img 
              src={signupLoginImg} 
              alt="AccessHub"
              className="w-full h-full object-contain filter drop-shadow-md"
            />
          </div>

          {/* Title, Description & Buttons */}
          <div className="space-y-1.5 px-2 w-full">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Join AccessHub Today
            </h2>
            <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto leading-relaxed">
              Sri Lanka's premier 100% barrier-free inclusive marketplace & career community.
            </p>

            {/* Identical Beautiful Buttons directly below paragraph */}
            <div className="pt-4 w-52 mx-auto space-y-3 flex flex-col items-center">
              <button
                onClick={() => {
                  speakText('Opening Registration Form');
                  setAuthMode('register');
                  setAuthView('form');
                }}
                className="w-52 h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 flex items-center justify-center transition-all"
              >
                <span>Create Account</span>
              </button>

              <button
                onClick={() => {
                  speakText('Opening Login Form');
                  setAuthMode('login');
                  setAuthView('form');
                }}
                className="w-52 h-12 rounded-2xl bg-teal-600 hover:bg-teal-700 active:scale-98 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 flex items-center justify-center transition-all"
              >
                <span>Log In</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    );
  }

  // 2. DETAILED LOGIN / REGISTER FORM SCREEN
  return (
    <div className="w-full h-full min-h-[800px] bg-white text-slate-900 flex flex-col p-6 overflow-y-auto select-none animate-fadeIn">
      
      {/* Back to Selection */}
      <div className="flex items-center justify-between pb-2">
        <button
          onClick={() => setAuthView('selection')}
          className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-[11px] font-extrabold text-teal-600 bg-teal-50 px-3 py-0.5 rounded-full border border-teal-100">
          {authMode === 'login' ? 'Sign In' : 'Registration'}
        </span>
      </div>

      {/* Brand Header */}
      <div className="text-center pt-2 pb-4 space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
          {authMode === 'login' ? 'Welcome Back!' : 'Create Your Account'}
        </h2>
        <p className="text-xs text-slate-500 font-medium">
          {authMode === 'login' ? 'Sign in to access your inclusive account' : 'Select your user role and register'}
        </p>
      </div>

      {/* Login vs Register Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-4 border border-slate-200">
        <button
          onClick={() => setAuthMode('login')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            authMode === 'login' 
              ? 'bg-teal-600 text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setAuthMode('register')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            authMode === 'register' 
              ? 'bg-teal-600 text-white shadow-xs' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          Register Account
        </button>
      </div>

      {/* Role Selection Grid (When Registering) */}
      {authMode === 'register' && (
        <div className="space-y-2 mb-4">
          <label className="text-xs font-extrabold uppercase text-slate-400 block tracking-wider">
            Select Your Role (6 Account Types)
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
                      ? 'border-teal-600 bg-teal-50 text-teal-700 ring-2 ring-teal-500/20' 
                      : 'border-slate-200 bg-white text-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 mt-0.5 text-teal-600" />
                  <div className="overflow-hidden">
                    <span className="text-[11px] font-bold block truncate">{r.label}</span>
                    <span className="text-[9px] text-slate-400 block leading-tight">{r.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Inputs */}
      <form onSubmit={handleAuthSubmit} className="space-y-3">
        
        {authMode === 'register' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Email Address</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Password</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs shadow-lg shadow-teal-600/30 transition-all mt-2"
        >
          {authMode === 'login' ? 'Sign In to AccessHub' : 'Complete Registration'}
        </button>

      </form>

      {/* Biometric & Guest Quick Actions */}
      <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
        <button
          onClick={() => {
            speakText('Biometric authentication verified');
            setActiveScreen('home');
          }}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center space-x-1.5 font-bold mr-1.5 hover:bg-slate-100 text-slate-700"
        >
          <Fingerprint className="w-4 h-4 text-teal-600" />
          <span>Biometric</span>
        </button>

        <button
          onClick={() => {
            speakText('Continuing to AccessHub');
            setActiveScreen('home');
          }}
          className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center space-x-1.5 font-bold ml-1.5 hover:bg-slate-100 text-slate-700"
        >
          <Compass className="w-4 h-4 text-teal-600" />
          <span>Guest Mode</span>
        </button>
      </div>

    </div>
  );
};
