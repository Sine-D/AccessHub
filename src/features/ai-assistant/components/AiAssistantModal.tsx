import React, { useState } from 'react';
import { useAccessibility } from '../../../core/hooks/useAccessibility';
import { useAppState } from '../../../core/hooks/useAppState';
import { useSpeechRecognition } from '../../../core/hooks/useSpeechRecognition';
import { 
  Sparkles, 
  Mic, 
  Camera, 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Square,
  Trash2
} from 'lucide-react';

export const AiAssistantModal: React.FC = () => {
  const { aiModalOpen, setAiModalOpen, speakText } = useAccessibility();
  const { setActiveScreen } = useAppState();

  const [activeTab, setActiveTab] = useState<'voice' | 'camera' | 'fraud'>('voice');
  const [speechLanguage, setSpeechLanguage] = useState('en-US');
  const [aiResponse, setAiResponse] = useState<string>(
    'Ayubowan! I am AccessLink AI. Ask me anything via voice or scan an item.'
  );
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const {
    error: speechError,
    isListening,
    isSupported,
    resetTranscript,
    setTranscript,
    startListening,
    stopListening,
    transcript,
  } = useSpeechRecognition({ language: speechLanguage });

  if (!aiModalOpen) return null;

  const handleVoiceCommand = (command: string) => {
    const normalizedCommand = command.toLowerCase();
    setAiResponse(`Processing: “${command}”`);
    speakText(`Processing command: ${command}`);

    setTimeout(() => {
      if (normalizedCommand.includes('wheelchair') || normalizedCommand.includes('marketplace')) {
        setAiResponse('Found 4 nearby accessible marketplace items. Navigating to Marketplace...');
        speakText('Found nearby items. Navigating to Marketplace.');
        setTimeout(() => {
          setAiModalOpen(false);
          setActiveScreen('marketplace');
        }, 1500);
      } else if (normalizedCommand.includes('job')) {
        setAiResponse('Filtering 100% remote screen-reader friendly job postings...');
        speakText('Filtering accessible job postings.');
        setTimeout(() => {
          setAiModalOpen(false);
          setActiveScreen('jobs');
        }, 1500);
      } else if (normalizedCommand.includes('scan')) {
        setActiveTab('camera');
        setAiResponse('AI Vision active. Point camera at product or document.');
      } else {
        setAiResponse(`Processed command: "${command}". I am here to help you navigate AccessLink seamlessly.`);
        speakText(`Processed command ${command}`);
      }
    }, 1200);
  };

  const closeModal = () => {
    if (isListening) stopListening();
    setAiModalOpen(false);
  };

  const simulateScan = () => {
    speakText('Analyzing item with AI Vision scanner...');
    setTimeout(() => {
      setScannedResult('Handcrafted Ergonomic Bamboo Organizer (99.8% Match). Seller: Kavindi Perera (Verified Disability Seller).');
      speakText('Item identified: Handcrafted Ergonomic Bamboo Organizer. Verified seller Kavindi Perera.');
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div
        aria-labelledby="ai-assistant-title"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        role="dialog"
      >
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-teal-600 to-indigo-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 id="ai-assistant-title" className="font-extrabold text-base leading-tight">AccessLink AI Assistant</h3>
              <p className="text-[11px] text-blue-100">Smart Voice & Vision Accessibility Engine</p>
            </div>
          </div>
          <button
            aria-label="Close AI assistant"
            onClick={closeModal}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-1">
          <button
            onClick={() => setActiveTab('voice')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'voice' 
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Assistant</span>
          </button>
          <button
            onClick={() => setActiveTab('camera')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'camera' 
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AI Scanner</span>
          </button>
          <button
            onClick={() => setActiveTab('fraud')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'fraud' 
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>AI Fraud Shield</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB 1: VOICE ASSISTANT */}
          {activeTab === 'voice' && (
            <div className="flex flex-col items-center text-center space-y-4 py-2">

              <div className="w-full text-left">
                <label htmlFor="speech-language" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Recognition language
                </label>
                <select
                  id="speech-language"
                  value={speechLanguage}
                  onChange={(event) => setSpeechLanguage(event.target.value)}
                  disabled={isListening}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="en-US">English</option>
                  <option value="si-LK">සිංහල (Sinhala)</option>
                  <option value="ta-LK">தமிழ் (Tamil)</option>
                </select>
              </div>

              {/* Accessible microphone controls */}
              <div className="relative">
                <button
                  aria-label={isListening ? 'Microphone is listening' : 'Start voice capture'}
                  aria-pressed={isListening}
                  disabled={isListening || !isSupported}
                  onClick={startListening}
                  className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all ${
                    isListening 
                      ? 'bg-red-500 text-white animate-pulse ring-8 ring-red-200 dark:ring-red-950' 
                      : 'bg-gradient-to-tr from-blue-600 to-teal-500 text-white hover:scale-105 disabled:cursor-not-allowed disabled:from-slate-500 disabled:to-slate-600'
                  }`}
                >
                  <Mic className="w-9 h-9" />
                </button>
                {isListening && (
                  <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-red-500 uppercase tracking-widest animate-bounce">
                    Listening...
                  </span>
                )}
              </div>

              {isListening && (
                <button
                  onClick={stopListening}
                  className="min-h-11 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Square aria-hidden="true" className="h-4 w-4 fill-current" />
                    Stop listening
                  </span>
                </button>
              )}

              <p aria-live="polite" className="sr-only" role="status">
                {isListening ? 'Voice capture started. Speak now.' : 'Voice capture stopped.'}
              </p>

              {!isSupported && (
                <div className="w-full rounded-xl border border-amber-300 bg-amber-50 p-3 text-left text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200" role="alert">
                  Voice recognition is not supported in this browser. Use current Chrome or Edge, or type your query below.
                </div>
              )}

              {speechError && (
                <div className="w-full rounded-xl border border-red-300 bg-red-50 p-3 text-left text-xs text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200" role="alert">
                  <span className="flex items-start gap-2">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    {speechError}
                  </span>
                </div>
              )}

              <div className="w-full text-left">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="voice-transcript" className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Voice search transcript
                  </label>
                  <button
                    aria-label="Clear voice transcript"
                    disabled={!transcript}
                    onClick={resetTranscript}
                    className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-white"
                  >
                    <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                    Clear
                  </button>
                </div>
                <textarea
                  id="voice-transcript"
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  placeholder="Your speech appears here. You can also type or correct the text."
                  rows={3}
                  className="mt-1 w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  disabled={!transcript.trim() || isListening}
                  onClick={() => handleVoiceCommand(transcript.trim())}
                  className="mt-2 min-h-11 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-extrabold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  Use transcript
                </button>
              </div>

              {/* AI Response Card */}
              <div className="w-full bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-3.5 text-left flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {aiResponse}
                </div>
              </div>

              {/* Suggested Voice Commands */}
              <div className="w-full text-left space-y-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-400">Try Voice Commands:</span>
                <div className="flex flex-col space-y-1.5">
                  {[
                    'Find nearby wheelchair products',
                    'Show 100% remote accessible jobs',
                    'Scan document or product tag',
                    'Open Accessibility Quick Settings'
                  ].map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTranscript(cmd)}
                      className="w-full text-left text-xs bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 p-2.5 rounded-xl text-slate-700 dark:text-slate-200 flex items-center justify-between font-medium transition-all"
                    >
                      <span>🗣️ "{cmd}"</span>
                      <Zap className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: AI CAMERA SCANNER */}
          {activeTab === 'camera' && (
            <div className="space-y-4">
              <div className="relative w-full h-48 bg-slate-950 rounded-2xl overflow-hidden border-2 border-dashed border-teal-400/60 flex flex-col items-center justify-center p-4">
                <Camera className="w-10 h-10 text-teal-400 animate-pulse mb-2" />
                <p className="text-xs text-slate-300 font-medium text-center">
                  Point your camera at a physical product, barcode, or Braille label
                </p>
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/10 to-transparent animate-shimmer pointer-events-none"></div>
              </div>

              <button
                onClick={simulateScan}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Simulate Camera Scan</span>
              </button>

              {scannedResult && (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Scan Result Verified</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                    {scannedResult}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FRAUD SHIELD */}
          {activeTab === 'fraud' && (
            <div className="space-y-3 py-1">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-slate-800 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-2">
                <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                  AccessLink AI Safety & Verification Shield
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Every seller disability certificate, NGO registration, and job posting undergoes automated AI cross-verification.
                </p>
              </div>

              <div className="space-y-2">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">Disability Certificate Verification</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>100% Verified</span>
                  </span>
                </div>
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700 dark:text-slate-200">NGO Registration & Escrow Protection</span>
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active</span>
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
