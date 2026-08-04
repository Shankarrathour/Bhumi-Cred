import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import en from './en/translation.json';
import hi from './hi/translation.json';

const LANGUAGE_KEY = 'bhumicred_app_lang';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
};

// Register react-i18next synchronously so it is available during Expo's
// server render. Persisted preferences are applied afterwards on the client.
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    compatibilityJSON: 'v3',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  } as any);

const canUseStorage = Platform.OS !== 'web' || typeof window !== 'undefined';

const loadSavedLanguage = async () => {
  if (!canUseStorage) {
    return;
  }

  try {
    const cached = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (cached === 'en' || cached === 'hi') {
      await i18n.changeLanguage(cached);
    }
  } catch (error) {
    console.log('Error loading saved language:', error);
  }
};

void loadSavedLanguage();

export const changeLanguage = async (lang: 'en' | 'hi') => {
  try {
    if (canUseStorage) {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    }
    await i18n.changeLanguage(lang);
  } catch (error) {
    console.log('Error changing language:', error);
  }
};

export default i18n;
