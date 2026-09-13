import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import { normalizeTranscript } from '../utils/normalizeTranscript';

const errorMessages: Record<string, string> = {
  aborted: 'Voice capture was stopped.',
  'audio-capture':
    'No working microphone was found. Check your device audio settings.',
  'bad-grammar':
    'The speech service could not understand the recognition rules.',
  'language-not-supported':
    'The selected speech language is not supported on this device.',
  network:
    'Voice recognition could not reach the speech service. Check your internet connection.',
  'no-speech':
    'No speech was detected. Move closer to the microphone and try again.',
  'not-allowed':
    'Microphone access was blocked. Allow microphone permission in your browser and try again.',
  'phrases-not-supported':
    'Speech phrases are not supported by this browser.',
  'service-not-allowed':
    'This browser has blocked the speech-recognition service.',
};

interface UseSpeechRecognitionOptions {
  fallbackLanguage?: string;
  language?: string;
  onLanguageFallback?: (language: string) => void;
}

export const useSpeechRecognition = ({
  fallbackLanguage = 'en-LK',
  language = 'en-US',
  onLanguageFallback,
}: UseSpeechRecognitionOptions = {}) => {
  const recognitionRef =
    useRef<SpeechRecognition | null>(null);

  const committedTranscriptRef = useRef('');
  const fallbackAttemptedRef = useRef(false);

  const [transcript, setTranscriptState] =
    useState('');

  const [isListening, setIsListening] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const Recognition =
    typeof window === 'undefined'
      ? undefined
      : window.SpeechRecognition ??
        window.webkitSpeechRecognition;

  const isSupported = Boolean(Recognition);

  /*
   * Normalizes manually typed or corrected transcript text
   * before saving it as the committed transcript.
   */
  const setTranscript = useCallback(
    (value: string) => {
      const normalizedValue =
        normalizeTranscript(value);

      committedTranscriptRef.current =
        normalizedValue;

      setTranscriptState(normalizedValue);
    },
    [],
  );

  const resetTranscript = useCallback(() => {
    committedTranscriptRef.current = '';
    setTranscriptState('');
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const startListening = useCallback(() => {
    if (!Recognition) {
      setError(
        'Voice recognition is not supported in this browser. Use current Chrome or Edge, or type your query below.',
      );

      return;
    }

    if (isListening) return;

    const recognition = new Recognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];

        const spokenText =
          result[0]?.transcript ?? '';

        if (result.isFinal) {
          finalText += spokenText;
        } else {
          interimText += spokenText;
        }
      }

      /*
       * Adds the final recognized words to the committed
       * transcript and normalizes Unicode and spacing.
       */
      if (finalText.trim()) {
        committedTranscriptRef.current =
          normalizeTranscript(
            [
              committedTranscriptRef.current,
              finalText,
            ]
              .filter(Boolean)
              .join(' '),
          );
      }

      /*
       * Displays the committed transcript together with
       * the latest interim recognition result.
       */
      setTranscriptState(
        normalizeTranscript(
          [
            committedTranscriptRef.current,
            interimText,
          ]
            .filter(Boolean)
            .join(' '),
        ),
      );
    };

    recognition.onerror = (event) => {
      if (
        event.error === 'language-not-supported' &&
        language !== fallbackLanguage &&
        !fallbackAttemptedRef.current
      ) {
        fallbackAttemptedRef.current = true;
        onLanguageFallback?.(fallbackLanguage);
        setError(
          'The selected spoken language is not supported by this device. Recognition has switched to English. You can also type or correct the transcript.',
        );
        setIsListening(false);
        return;
      }

      if (event.error !== 'aborted') {
        setError(
          errorMessages[event.error] ??
            'Voice recognition failed. Please try again or type your query.',
        );
      }

      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);

      setError(
        'The microphone is already in use. Stop the current recording and try again.',
      );
    }
  }, [
    Recognition,
    fallbackLanguage,
    isListening,
    language,
    onLanguageFallback,
  ]);

  useEffect(() => {
    fallbackAttemptedRef.current = false;
  }, [language]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    error,
    isListening,
    isSupported,
    resetTranscript,
    setTranscript,
    startListening,
    stopListening,
    transcript,
  };
};
