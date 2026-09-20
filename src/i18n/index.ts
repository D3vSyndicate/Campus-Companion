import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import afri from './locales/afri.json';
import en from './locales/en.json';
import xh from './locales/xh.json';

const resources = {
  en: { translation: en },
  xh: { translation: xh },
  af: { translation: afri },
};

export const SUPPORTED_LANGUAGES = ['en', 'xh', 'af'] as const;
const LANGUAGE_KEY = 'app:language';

const isSupported = (code: string | null | undefined): code is (typeof SUPPORTED_LANGUAGES)[number] =>
  Boolean(code) && (SUPPORTED_LANGUAGES as readonly string[]).includes(code as string);

// Start in the phone's language when the app has it. Any other language (isiZulu, French...) starts in English,
// so nothing is left half-translated or showing a language the language switcher cannot select.
const deviceLanguage = Localization.getLocales()[0]?.languageCode;

void i18n.use(initReactI18next).init({
  resources,
  lng: isSupported(deviceLanguage) ? deviceLanguage : 'en',
  fallbackLng: 'en',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
});

// A student's own choice wins over the phone's language, and is remembered for next time.
void AsyncStorage.getItem(LANGUAGE_KEY)
  .then((saved) => {
    if (isSupported(saved) && saved !== i18n.language) void i18n.changeLanguage(saved);
  })
  .catch(() => undefined);

i18n.on('languageChanged', (language) => {
  if (isSupported(language)) void AsyncStorage.setItem(LANGUAGE_KEY, language).catch(() => undefined);
});

export default i18n;
