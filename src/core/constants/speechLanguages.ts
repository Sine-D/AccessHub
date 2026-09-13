export const SUPPORTED_SPEECH_LANGUAGES = [
  {
    locale: 'en-LK',
    label: 'English',
    nativeLabel: 'English',
    example: 'Find accessible places in Colombo',
  },
  {
    locale: 'si-LK',
    label: 'Sinhala',
    nativeLabel: 'සිංහල',
    example: 'කොළඹ රෝද පුටු ප්‍රවේශය ඇති ස්ථාන සොයන්න',
  },
  {
    locale: 'ta-LK',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    example:
      'கொழும்பில் சக்கர நாற்காலி வசதியுள்ள இடங்களைக் கண்டுபிடி',
  },
] as const;

export type SpeechLocale =
  (typeof SUPPORTED_SPEECH_LANGUAGES)[number]['locale'];

export const DEFAULT_SPEECH_LOCALE: SpeechLocale = 'en-LK';

export const isSupportedSpeechLocale = (
  value: string,
): value is SpeechLocale =>
  SUPPORTED_SPEECH_LANGUAGES.some(
    (language) => language.locale === value,
  );

export const getSpeechLanguage = (locale: SpeechLocale) =>
  SUPPORTED_SPEECH_LANGUAGES.find(
    (language) => language.locale === locale,
  ) ?? SUPPORTED_SPEECH_LANGUAGES[0];