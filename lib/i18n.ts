import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import mn from '../locales/mn.json';
import en from '../locales/en.json';

i18n.use(initReactI18next).init({
  resources: {
    mn: { translation: mn },
    en: { translation: en },
  },
  lng: 'mn',
  fallbackLng: 'mn',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;
