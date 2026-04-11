import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAppLanguage, LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { SupportedLanguage } from '@/types/user';

const LANGUAGE_DATA: Record<string, { flag: string; native: string; hint: string }> = {
  de: { flag: '🇩🇪', native: 'Deutsch',     hint: 'Bitte wähle deine Sprache' },
  en: { flag: '🇬🇧', native: 'English',     hint: 'Please choose your language' },
  ar: { flag: '🇸🇦', native: 'العربية',    hint: 'يرجى اختيار لغتك' },
  tr: { flag: '🇹🇷', native: 'Türkçe',     hint: 'Lütfen dilinizi seçin' },
  ro: { flag: '🇷🇴', native: 'Română',     hint: 'Vă rugăm să alegeți limba' },
  hu: { flag: '🇭🇺', native: 'Magyar',     hint: 'Kérem, válasszon nyelvet' },
  hi: { flag: '🇮🇳', native: 'हिन्दी',     hint: 'कृपया अपनी भाषा चुनें' },
  fa: { flag: '🇮🇷', native: 'دری / فارسی', hint: 'لطفاً زبان خود را انتخاب کنید' },
  rom: { flag: '🏕️', native: 'Romani',     hint: 'Te rog, cher čhibakiri' },
};

export default function LanguageSelectScreen() {
  const [selected, setSelected] = useState<SupportedLanguage | null>(null);

  async function handleSelect(lang: SupportedLanguage) {
    setSelected(lang);
    setAppLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
    setTimeout(() => {
      router.replace('/(auth)/login');
    }, 200);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Logo + Titel */}
        <View style={styles.header}>
          <Text style={styles.logo}>✦</Text>
          <Text style={styles.appName}>Maia's Voice</Text>
          <Text style={styles.tagline}>🌍  Choose your language</Text>
        </View>

        {/* Sprachen-Grid */}
        <View style={styles.grid}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const info = LANGUAGE_DATA[lang];
            const isSelected = selected === lang;
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.langBtn, isSelected && styles.langBtnSelected]}
                onPress={() => handleSelect(lang)}
                activeOpacity={0.75}
                accessibilityLabel={`${info.native} — ${info.hint}`}
                accessibilityRole="button"
              >
                <Text style={styles.flag}>{info.flag}</Text>
                <Text style={[styles.langName, isSelected && styles.langNameSelected]}>
                  {info.native}
                </Text>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Hinweis */}
        <Text style={styles.hint}>
          Du kannst die Sprache jederzeit in den Einstellungen ändern.{'\n'}
          You can change the language anytime in settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0D0A1E',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    gap: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 24,
  },
  logo: {
    fontSize: 56,
    color: '#C9956A',
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 16,
    color: '#C0B0E0',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 480,
  },
  langBtn: {
    width: '45%',
    backgroundColor: '#1A1035',
    borderWidth: 2,
    borderColor: '#3A2A5A',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
    flexDirection: 'column',
  },
  langBtnSelected: {
    borderColor: '#C9956A',
    backgroundColor: '#2A1A40',
  },
  flag: {
    fontSize: 32,
  },
  langName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  langNameSelected: {
    color: '#C9956A',
  },
  checkmark: {
    fontSize: 18,
    color: '#C9956A',
    fontWeight: '700',
  },
  hint: {
    color: '#8070A0',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
});
