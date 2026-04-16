import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';

import de  from '../locales/de.json';
import en  from '../locales/en.json';
import ro  from '../locales/ro.json';
import hu  from '../locales/hu.json';
import rom from '../locales/rom.json';

// European languages only — RTL languages (ar, fa) → separate app in Phase 2
export const RTL_LANGUAGES: string[] = [];
export const SUPPORTED_LANGUAGES = ['de', 'en', 'ro', 'hu', 'rom'] as const;

export const LANGUAGE_LABELS: Record<string, string> = {
  de:  'Deutsch',
  en:  'English',
  ro:  'Română',
  hu:  'Magyar',
  rom: 'Romani',
};

export function isRTL(lang: string): boolean {
  return RTL_LANGUAGES.includes(lang);
}

export function setAppLanguage(lang: string): void {
  // All supported languages are LTR — no RTL flip needed
  I18nManager.forceRTL(false);
  I18nManager.allowRTL(false);
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
    de:  { translation: de  },
    en:  { translation: en  },
    ro:  { translation: ro  },
    hu:  { translation: hu  },
    rom: { translation: rom },
  },
});

export default i18n;
