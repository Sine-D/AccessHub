import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { normalizeTranscript } from '../../core/utils/normalizeTranscript';

type RecognitionConstructor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: null | (() => void);
  onresult: null | ((event: any) => void);
  onerror: null | ((event: any) => void);
  onend: null | (() => void);
  start: () => void;
  stop: () => void;
  abort: () => void;
};

const recognitionErrors: Record<string, string> = {
  'audio-capture': 'No working microphone was found. Check the device audio settings.',
  'language-not-supported': 'This device does not support the selected spoken language.',
  network: 'Speech recognition could not reach the speech service.',
  'no-speech': 'No speech was detected. Move closer to the microphone and try again.',
  'not-allowed': 'Microphone access was blocked. Allow microphone permission and try again.',
  'service-not-allowed': 'The browser blocked its speech-recognition service.',
};

function getWebRecognition(): RecognitionConstructor | undefined {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return undefined;
  const speechWindow = window as typeof window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
}

export function useMobileSpeechRecognition(language: string) {
  const recognitionRef = useRef<InstanceType<RecognitionConstructor> | null>(null);
  const committedTranscript = useRef('');
  const [transcript, setTranscriptState] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const Recognition = getWebRecognition();
  const isWebSpeechSupported = Boolean(Recognition);

  const setTranscript = useCallback((value: string) => {
    committedTranscript.current = value;
    setTranscriptState(value);
  }, []);

  const clearTranscript = useCallback(() => {
    committedTranscript.current = '';
    setTranscriptState('');
    setMessage(null);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!Recognition) {
      setMessage(
        Platform.OS === 'web'
          ? 'Live speech recognition is unavailable in this browser. Type your request instead.'
          : 'Expo Go cannot access native speech-to-text directly. The text field is focused—tap the microphone on your phone keyboard, or type your request.',
      );
      return false;
    }
    if (isListening) return true;

    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setMessage('Listening… Speak your accessibility request.');
      setIsListening(true);
    };
    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const spoken = result[0]?.transcript ?? '';
        if (result.isFinal) finalText += spoken;
        else interimText += spoken;
      }
      if (finalText.trim()) {
        committedTranscript.current = normalizeTranscript(
          [committedTranscript.current, finalText].filter(Boolean).join(' '),
        );
      }
      setTranscriptState(
        normalizeTranscript([committedTranscript.current, interimText].filter(Boolean).join(' ')),
      );
    };
    recognition.onerror = (event) => {
      if (event.error !== 'aborted') {
        setMessage(recognitionErrors[event.error] ?? 'Voice recognition failed. Type your request or try again.');
      }
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
      setMessage((current) => current === 'Listening… Speak your accessibility request.' ? 'Transcript ready. You can edit it before searching.' : current);
    };
    recognitionRef.current = recognition;
    try {
      recognition.start();
      return true;
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setMessage('The microphone is already in use. Stop it and try again.');
      return false;
    }
  }, [Recognition, isListening, language]);

  useEffect(() => {
    setMessage(null);
    return () => recognitionRef.current?.abort();
  }, [language]);

  return {
    clearTranscript,
    isListening,
    isWebSpeechSupported,
    message,
    setMessage,
    setTranscript,
    startListening,
    stopListening,
    transcript,
  };
}
