export const LANGUAGE_STORAGE_KEY = "jobs_placements_language";
export const LANGUAGE_COOKIE_KEY = "jobs_placements_language";
export const DEFAULT_LANGUAGE = "en";

export const supportedLanguages = [
  { code: "en", label: "English", nativeLabel: "English", dir: "ltr" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", dir: "ltr" },
  { code: "mr", label: "Marathi", nativeLabel: "मराठी", dir: "ltr" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", dir: "ltr" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்", dir: "ltr" },
  { code: "te", label: "Telugu", nativeLabel: "తెలుగు", dir: "ltr" },
  { code: "kn", label: "Kannada", nativeLabel: "ಕನ್ನಡ", dir: "ltr" },
  { code: "ml", label: "Malayalam", nativeLabel: "മലയാളം", dir: "ltr" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা", dir: "ltr" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ", dir: "ltr" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو", dir: "rtl" },
  { code: "or", label: "Odia", nativeLabel: "ଓଡ଼ିଆ", dir: "ltr" },
  { code: "as", label: "Assamese", nativeLabel: "অসমীয়া", dir: "ltr" },
  { code: "sa", label: "Sanskrit", nativeLabel: "संस्कृतम्", dir: "ltr" },
  { code: "kok", label: "Konkani", nativeLabel: "कोंकणी", dir: "ltr" },
  { code: "mni", label: "Manipuri", nativeLabel: "মৈতৈলোন্", dir: "ltr" },
  { code: "ne", label: "Nepali", nativeLabel: "नेपाली", dir: "ltr" },
  { code: "brx", label: "Bodo", nativeLabel: "बरʼ", dir: "ltr" },
  { code: "doi", label: "Dogri", nativeLabel: "डोगरी", dir: "ltr" },
  { code: "ks", label: "Kashmiri", nativeLabel: "کٲشُر", dir: "rtl" },
  { code: "mai", label: "Maithili", nativeLabel: "मैथिली", dir: "ltr" },
  { code: "sat", label: "Santali", nativeLabel: "ᱥᱟᱱᱛᱟᱲᱤ", dir: "ltr" },
  { code: "sd", label: "Sindhi", nativeLabel: "سنڌي", dir: "rtl" },
];

export const supportedLanguageCodes = supportedLanguages.map((language) => language.code);

export const rtlLanguageCodes = supportedLanguages
  .filter((language) => language.dir === "rtl")
  .map((language) => language.code);

export const getSupportedLanguage = (languageCode) => {
  if (!languageCode) return DEFAULT_LANGUAGE;

  const normalizedCode = String(languageCode).toLowerCase();
  const exactMatch = supportedLanguageCodes.find((code) => code === normalizedCode);
  if (exactMatch) return exactMatch;

  const baseCode = normalizedCode.split("-")[0];
  return supportedLanguageCodes.includes(baseCode) ? baseCode : DEFAULT_LANGUAGE;
};

export const getLanguageMeta = (languageCode) =>
  supportedLanguages.find((language) => language.code === getSupportedLanguage(languageCode)) || supportedLanguages[0];

export const getLanguageDirection = (languageCode) => getLanguageMeta(languageCode).dir;

export const getLanguageLabel = (languageCode) => getLanguageMeta(languageCode).nativeLabel;
