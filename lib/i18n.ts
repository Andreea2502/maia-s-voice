import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';

import ar from '../locales/ar.json';
import hi from '../locales/hi.json';
import rom from '../locales/rom.json';
import tr from '../locales/tr.json';
import fa from '../locales/fa.json';
import ro from '../locales/ro.json';
import hu from '../locales/hu.json';
import de from '../locales/de.json';
import en from '../locales/en.json';

export const RTL_LANGUAGES = ['ar', 'fa'];
export const SUPPORTED_LANGUAGES = ['ar', 'hi', 'rom', 'tr', 'fa', 'ro', 'hu', 'de', 'en'] as const;

export const LANGUAGE_LABELS: Record<string, string> = {
  ar: 'العربية',
  hi: 'हिन्दी',
  rom: 'Romani',
  tr: 'Türkçe',
  fa: 'دری / فارسی',
  ro: 'Română',
  hu: 'Magyar',
  de: 'Deutsch',
  en: 'English',
};

export function isRTL(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function setAppLanguage(lang: string): void {
  const rtl = isRTL(lang);
  I18nManager.forceRTL(rtl);
  I18nManager.allowRTL(rtl);
  i18n.changeLanguage(lang);
}

export function detectSystemLanguage(): string {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'de';
  if (SUPPORTED_LANGUAGES.includes(locale as any)) return locale;
  return 'de';
}

i18n.use(initReactI18next).init({
  fallbackLng: 'de',
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
  resources: {
    ar: { translation: ar },
    hi: { translation: hi },
    rom: { translation: rom },
    tr: { translation: tr },
    fa: { translation: fa },
    ro: { translation: ro },
    hu: { translation: hu },
    de: { translation: de },
    en: { translation: en },
  },
});

export default i18n;
