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

type NativeSubscription = { remove: () => void };
type NativeSpeechModule = {
  abort: () => void;
  addListener: (event: string, listener: (event: any) => void) => NativeSubscription;
  isRecognitionAvailable: () => boolean;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: Record<string, unknown>) => void;
  stop: () => void;
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
  const nativeModuleRef = useRef<NativeSpeechModule | null>(null);
  const nativeSubscriptionsRef = useRef<NativeSubscription[]>([]);
  const nativeSessionBaseRef = useRef('');
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

  const removeNativeSubscriptions = useCallback(() => {
    nativeSubscriptionsRef.current.forEach((subscription) => subscription.remove());
    nativeSubscriptionsRef.current = [];
  }, []);

  const stopListening = useCallback(() => {
    if (Platform.OS === 'web') recognitionRef.current?.stop();
    else nativeModuleRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (Platform.OS !== 'web') {
      if (isListening) return true;

      let nativeModule: NativeSpeechModule;
      try {
        const speechPackage = require('expo-speech-recognition') as {
          ExpoSpeechRecognitionModule?: NativeSpeechModule;
        };
        if (!speechPackage.ExpoSpeechRecognitionModule) throw new Error('Native module missing');
        nativeModule = speechPackage.ExpoSpeechRecognitionModule;
      } catch {
        setMessage('Expo Go does not include native speech recognition. Use a development build, or tap the microphone on your phone keyboard.');
        return false;
      }

      if (!nativeModule.isRecognitionAvailable()) {
        setMessage('Speech recognition is disabled or unavailable on this device. Enable the phone speech service and try again.');
        return false;
      }

      removeNativeSubscriptions();
      nativeModuleRef.current = nativeModule;
      nativeSessionBaseRef.current = committedTranscript.current;
      nativeSubscriptionsRef.current = [
        nativeModule.addListener('start', () => {
          setIsListening(true);
          setMessage('Listening… Speak your accessibility request.');
        }),
        nativeModule.addListener('result', (event) => {
          const spoken = event.results?.[0]?.transcript ?? '';
          if (!spoken.trim()) return;
          const nextTranscript = normalizeTranscript(
            [nativeSessionBaseRef.current, spoken].filter(Boolean).join(' '),
          );
          setTranscriptState(nextTranscript);
          if (event.isFinal) committedTranscript.current = nextTranscript;
        }),
        nativeModule.addListener('error', (event) => {
          if (event.error !== 'aborted') {
            setMessage(recognitionErrors[event.error] ?? event.message ?? 'Voice recognition failed. Try again or type your request.');
          }
          setIsListening(false);
        }),
        nativeModule.addListener('end', () => {
          setIsListening(false);
          setMessage((current) => current === 'Listening… Speak your accessibility request.'
            ? 'Transcript ready. You can edit it before searching.'
            : current);
        }),
      ];

      setMessage('Requesting microphone and speech-recognition permission…');
      void nativeModule.requestPermissionsAsync()
        .then((permission) => {
          if (!permission.granted) {
            setMessage('Microphone or speech-recognition permission was denied. Allow both permissions in device settings.');
            return;
          }
          nativeModule.start({
            lang: language,
            interimResults: true,
            continuous: false,
            maxAlternatives: 1,
            iosTaskHint: 'search',
            contextualStrings: ['AccessHub', 'wheelchair ramp', 'accessible parking', 'Braille', 'sign language'],
          });
        })
        .catch(() => {
          setIsListening(false);
          setMessage('The microphone could not start. Check permissions and the device speech service.');
        });
      return true;
    }

    if (!Recognition) {
      setMessage('Live speech recognition is unavailable in this browser. Open Expo web in Chrome or Edge, or type your request.');
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
  }, [Recognition, isListening, language, removeNativeSubscriptions]);

  useEffect(() => {
    setMessage(null);
    return () => {
      recognitionRef.current?.abort();
      nativeModuleRef.current?.abort();
      nativeModuleRef.current = null;
      removeNativeSubscriptions();
    };
  }, [language, removeNativeSubscriptions]);

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
