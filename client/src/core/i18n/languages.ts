export interface LanguageMeta {
  code: string;
  label: string;
  nativeLabel: string;
  dir: 'ltr' | 'rtl';
}

export const LANGUAGE_STORAGE_KEY = 'jobs_placements_language';
export const DEFAULT_LANGUAGE = 'en';

export const supportedLanguages: readonly LanguageMeta[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'Hindi', dir: 'ltr' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'Gujarati', dir: 'ltr' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'Marathi', dir: 'ltr' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'Tamil', dir: 'ltr' },
  { code: 'te', label: 'Telugu', nativeLabel: 'Telugu', dir: 'ltr' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'Kannada', dir: 'ltr' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'Malayalam', dir: 'ltr' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'Punjabi', dir: 'ltr' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'Bengali', dir: 'ltr' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'Urdu', dir: 'rtl' }
];

export const supportedLanguageCodes = supportedLanguages.map((language) => language.code);

export const getSupportedLanguage = (languageCode: string | null | undefined): string => {
  if (!languageCode) {
    return DEFAULT_LANGUAGE;
  }

  const normalized = languageCode.toLowerCase();
  if (supportedLanguageCodes.includes(normalized)) {
    return normalized;
  }

  const baseCode = normalized.split('-')[0] ?? DEFAULT_LANGUAGE;
  return supportedLanguageCodes.includes(baseCode) ? baseCode : DEFAULT_LANGUAGE;
};

export const getLanguageMeta = (languageCode: string): LanguageMeta =>
  supportedLanguages.find((language) => language.code === getSupportedLanguage(languageCode)) ?? supportedLanguages[0];
