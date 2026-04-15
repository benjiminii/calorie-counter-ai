import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import mn from '../locales/mn.json';
import en from '../locales/en.json';

const deviceLocale = getLocales()[0]?.languageCode ?? 'mn';

i18n.use(initReactI18next).init({
  resources: {
    mn: { translation: mn },
    en: { translation: en },
  },
  lng: deviceLocale === 'en' ? 'en' : 'mn',
  fallbackLng: 'mn',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
