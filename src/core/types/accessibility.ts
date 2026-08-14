export type UserRole = 
  | 'seller' 
  | 'service_provider' 
  | 'buyer' 
  | 'job_seeker' 
  | 'ngo' 
  | 'admin'
  | 'disabled_seller'
  | 'disabled_service'
  | 'customer'
  | 'company'
  | 'delivery';

export type DisabilityBadge = string;

export interface AccessibilitySettings {
  fontScale: 'sm' | 'md' | 'lg' | 'xl';
  highContrast: boolean;
  screenReader: boolean;
  voiceNavigation: boolean;
  speechToText?: boolean;
  textToSpeech?: boolean;
  signLanguageHelp: boolean;
  easyMode?: boolean;
  largeTapTargets: boolean;
  oneHandMode: boolean;
  darkMode: boolean;
}

export type AccessibilityPreset = 'deaf' | 'blind' | 'mobility' | 'cognitive' | 'custom';
