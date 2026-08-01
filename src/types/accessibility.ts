export type UserRole = 
  | 'disabled_seller' 
  | 'disabled_service' 
  | 'customer' 
  | 'company' 
  | 'ngo' 
  | 'delivery';

export type DisabilityBadge = 
  | 'Wheelchair User'
  | 'Hearing Impaired'
  | 'Visually Impaired'
  | 'Speech Impaired'
  | 'Neurodivergent'
  | 'Mobility Impaired'
  | 'Verified Inclusive NGO'
  | 'Accessible Workplace';

export interface AccessibilitySettings {
  fontScale: 'sm' | 'md' | 'lg' | 'xl';
  highContrast: boolean;
  darkMode: boolean;
  screenReader: boolean;
  voiceNavigation: boolean;
  speechToText: boolean;
  textToSpeech: boolean;
  signLanguageHelp: boolean;
  easyMode: boolean;
  oneHandMode: boolean;
  largeTapTargets: boolean;
}
