const HINDI_TEXT_PATTERN = /[\u0900-\u097F]/;
const HINGLISH_HINT_PATTERN = /\b(karna|hoga|ke baad|mein|me)\b/i;

export const englishOnlyMessage = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || HINDI_TEXT_PATTERN.test(trimmed) || HINGLISH_HINT_PATTERN.test(trimmed)) {
    return fallback;
  }
  return trimmed;
};

export const getEnglishApiErrorMessage = (error: any, fallback: string): string =>
  englishOnlyMessage(error?.response?.data?.message ?? error?.message, fallback);
