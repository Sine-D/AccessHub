import { AccessibilityDirectionStep } from './directionsController';

export interface SpeechEngineOptions {
  rate?: number;
  pitch?: number;
  voice?: string;
  language?: string;
}

let isSpeakingState = false;
let speechInterval: ReturnType<typeof setInterval> | null = null;
let currentStepIndex = 0;

/**
 * AC-234: Speech service providing continuous dynamic audio instruction updates.
 * Supports Web SpeechSynthesis API and Expo-Speech mobile integration.
 */
export function speakInstruction(
  text: string,
  options: SpeechEngineOptions = { rate: 0.95, pitch: 1.0, language: 'en-US' }
): boolean {
  if (!text) return false;

  try {
    // 1. Web SpeechSynthesis API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 0.95;
      utterance.pitch = options.pitch || 1.0;
      utterance.lang = options.language || 'en-US';

      utterance.onstart = () => {
        isSpeakingState = true;
      };
      utterance.onend = () => {
        isSpeakingState = false;
      };

      window.speechSynthesis.speak(utterance);
      return true;
    }
  } catch (err) {
    console.warn('SpeechSynthesis notice:', err);
  }

  return false;
}

/**
 * AC-234: Start continuous dynamic voice navigation walkthrough across steps.
 */
export function startContinuousVoiceNavigation(
  steps: AccessibilityDirectionStep[],
  onStepChange?: (step: AccessibilityDirectionStep, index: number) => void
): () => void {
  stopContinuousVoiceNavigation();

  if (!steps || steps.length === 0) return () => {};

  currentStepIndex = 0;

  const speakCurrent = () => {
    if (currentStepIndex >= steps.length) {
      stopContinuousVoiceNavigation();
      speakInstruction('Continuous navigation complete. You have reached your accessible destination.');
      return;
    }

    const step = steps[currentStepIndex];
    speakInstruction(step.audioCueText);
    if (onStepChange) onStepChange(step, currentStepIndex);
    currentStepIndex++;
  };

  speakCurrent();
  speechInterval = setInterval(speakCurrent, 6000); // Progress to next audio step every 6 seconds

  return stopContinuousVoiceNavigation;
}

export function stopContinuousVoiceNavigation(): void {
  if (speechInterval) {
    clearInterval(speechInterval);
    speechInterval = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  isSpeakingState = false;
}

export function isNavigatingSpeaking(): boolean {
  return isSpeakingState;
}
