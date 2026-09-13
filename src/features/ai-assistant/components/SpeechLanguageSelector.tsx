import React from 'react';
import {
  SpeechLocale,
  SUPPORTED_SPEECH_LANGUAGES,
} from '../../../core/constants/speechLanguages';

interface SpeechLanguageSelectorProps {
  disabled?: boolean;
  onChange: (locale: SpeechLocale) => void;
  value: SpeechLocale;
}

const languages = [
  { locale: 'en-US', nativeLabel: 'English', label: 'English' },
  { locale: 'si-LK', nativeLabel: 'සිංහල', label: 'Sinhala' },
  { locale: 'ta-LK', nativeLabel: 'தமிழ்', label: 'Tamil' },
];

export const SpeechLanguageSelector: React.FC<
  SpeechLanguageSelectorProps
> = ({ disabled = false, onChange, value }) => (
  <fieldset className="w-full text-left" disabled={disabled}>
    <legend className="text-xs font-bold text-slate-700 dark:text-slate-200">
      Spoken language
    </legend>

    <p
      id="speech-language-help"
      className="mt-1 text-[11px] text-slate-500 dark:text-slate-400"
    >
      Choose the language before starting the microphone.
    </p>

    <div
      aria-describedby="speech-language-help"
      className="mt-2 grid grid-cols-3 gap-2"
      role="radiogroup"
    >
      {SUPPORTED_SPEECH_LANGUAGES.map((language) => {
        const selected = value === language.locale;

        return (
          <label
            key={language.locale}
            className={`flex min-h-12 cursor-pointer items-center justify-center rounded-xl border px-2 py-2 text-center text-xs font-extrabold ${
              selected
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            <input
              checked={selected}
              className="sr-only"
              disabled={disabled}
              name="speech-language"
              onChange={() => onChange(language.locale)}
              type="radio"
              value={language.locale}
            />

            <span>
              <span className="block">{language.nativeLabel}</span>
              {language.nativeLabel !== language.label && (
                <span className="block text-[9px] opacity-80">
                  {language.label}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  </fieldset>
);