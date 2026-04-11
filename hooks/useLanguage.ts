import { useTranslation } from 'react-i18next';
import { I18nManager } from 'react-native';
import { setAppLanguage, isRTL, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { SupportedLanguage } from '@/types/user';
import { useSupabase } from './useSupabase';

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const supabase = useSupabase();

  const currentLanguage = i18n.language as SupportedLanguage;
  const rtl = isRTL(currentLanguage);

  async function changeLanguage(lang: SupportedLanguage) {
    setAppLanguage(lang);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({ preferred_language: lang }).eq('id', user.id);
    }
  }

  return {
    language: currentLanguage,
    rtl,
    t,
    changeLanguage,
    languageLabels: LANGUAGE_LABELS,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };
}
