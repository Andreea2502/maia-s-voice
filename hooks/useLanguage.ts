import { useTranslation } from 'react-i18next';
import { isRTL, LANGUAGE_LABELS, SUPPORTED_LANGUAGES, setAppLanguage } from '@/lib/i18n';
import { SupportedLanguage } from '@/types/user';
import { useSupabase } from './useSupabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const supabase = useSupabase();

  const currentLanguage = i18n.language as SupportedLanguage;
  const rtl = isRTL(currentLanguage);

  async function changeLanguage(lang: SupportedLanguage) {
    // 1. Apply immediately
    setAppLanguage(lang);
    // 2. Persist across restarts (read in app/_layout.tsx on startup)
    await AsyncStorage.setItem('app_language', lang);
    // 3. Save to user profile if logged in
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
