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
