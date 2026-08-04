const HINDI_TEXT_PATTERN = /[\u0900-\u097F]/;
const HINGLISH_HINT_PATTERN = /\b(karna|hoga|ke baad|mein|me)\b/i;

export const isHindiLikeText = (value?: string | null): boolean => {
  if (!value) return false;
  return HINDI_TEXT_PATTERN.test(value) || HINGLISH_HINT_PATTERN.test(value);
};

export const englishOnlyMessage = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  if (!trimmed || isHindiLikeText(trimmed)) return fallback;
  return trimmed;
};

export const getEnglishApiErrorMessage = (error: any, fallback: string): string =>
  englishOnlyMessage(error?.response?.data?.message ?? error?.message, fallback);
