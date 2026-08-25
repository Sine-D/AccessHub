import { create } from 'zustand';
import { AccessibilityInfo, Alert, Platform } from 'react-native';

export type UserRoleType = 'buyer' | 'artisan' | 'freelancer' | 'volunteer';

export interface AccessibilityAccommodations {
  visual: boolean;
  motor: boolean;
  hearing: boolean;
  cognitive: boolean;
}

export interface RegistrationFormData {
  fullName: string;
  email: string;
  password: string;
  role: UserRoleType;
  accommodations: AccessibilityAccommodations;
  otpCode: string;
}

interface AccessibilityState {
  // Global Accessibility Settings
  highContrast: boolean;
  fontScale: number; // 1.0 to 2.0 multiplier
  audioGuidance: boolean;

  // Wizard Step State
  step: 1 | 2 | 3 | 4;
  formData: RegistrationFormData;

  // Actions
  setHighContrast: (enabled: boolean) => void;
  setFontScale: (scale: number) => void;
  setAudioGuidance: (enabled: boolean) => void;
  setStep: (step: 1 | 2 | 3 | 4) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateFormData: (partial: Partial<RegistrationFormData>) => void;
  toggleAccommodation: (key: keyof AccessibilityAccommodations) => void;
  announceText: (message: string) => void;
  resetForm: () => void;
}

const initialFormData: RegistrationFormData = {
  fullName: '',
  email: '',
  password: '',
  role: 'buyer',
  accommodations: {
    visual: false,
    motor: false,
    hearing: false,
    cognitive: false,
  },
  otpCode: '',
};

export const useAccessibilityStore = create<AccessibilityState>((set, get) => ({
  highContrast: false,
  fontScale: 1.0,
  audioGuidance: true,

  step: 1,
  formData: initialFormData,

  setHighContrast: (highContrast) => {
    set({ highContrast });
    get().announceText(`High Contrast Mode ${highContrast ? 'Enabled' : 'Disabled'}`);
  },

  setFontScale: (fontScale) => {
    set({ fontScale });
    get().announceText(`Text Scale set to ${fontScale.toFixed(1)}x`);
  },

  setAudioGuidance: (audioGuidance) => {
    set({ audioGuidance });
    get().announceText(`Audio Guidance ${audioGuidance ? 'Activated' : 'Deactivated'}`);
  },

  setStep: (step) => {
    set({ step });
  },

  nextStep: () => {
    const currentStep = get().step;
    if (currentStep < 4) {
      const next = (currentStep + 1) as 1 | 2 | 3 | 4;
      set({ step: next });
    }
  },

  prevStep: () => {
    const currentStep = get().step;
    if (currentStep > 1) {
      const prev = (currentStep - 1) as 1 | 2 | 3 | 4;
      set({ step: prev });
    }
  },

  updateFormData: (partial) => {
    set((state) => ({
      formData: { ...state.formData, ...partial },
    }));
  },

  toggleAccommodation: (key) => {
    set((state) => ({
      formData: {
        ...state.formData,
        accommodations: {
          ...state.formData.accommodations,
          [key]: !state.formData.accommodations[key],
        },
      },
    }));
  },

  announceText: (message) => {
    if (get().audioGuidance) {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        AccessibilityInfo.announceForAccessibility(message);
      } else {
        // Fallback for Web/Simulation
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(message);
          window.speechSynthesis.speak(utterance);
        } else {
          Alert.alert('🔊 Screen Reader', message);
        }
      }
    }
  },

  resetForm: () => {
    set({ step: 1, formData: initialFormData });
  },
}));
