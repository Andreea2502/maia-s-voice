import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAppLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { SupportedLanguage } from '@/types/user';
import { C } from '@/lib/colors';

const LANGUAGE_DATA: Record<string, { flag: string; native: string; hint: string }> = {
  de:  { flag: '🇩🇪', native: 'Deutsch',      hint: 'Bitte wähle deine Sprache' },
  en:  { flag: '🇬🇧', native: 'English',      hint: 'Please choose your language' },
  ar:  { flag: '🇸🇦', native: 'العربية',     hint: 'يرجى اختيار لغتك' },
  tr:  { flag: '🇹🇷', native: 'Türkçe',      hint: 'Lütfen dilinizi seçin' },
  ro:  { flag: '🇷🇴', native: 'Română',      hint: 'Vă rugăm să alegeți limba' },
  hu:  { flag: '🇭🇺', native: 'Magyar',      hint: 'Kérem, válasszon nyelvet' },
  hi:  { flag: '🇮🇳', native: 'हिन्दी',      hint: 'कृपया अपनी भाषा चुनें' },
  fa:  { flag: '🇮🇷', native: 'دری / فارسی', hint: 'لطفاً زبان خود را انتخاب کنید' },
  rom: { flag: '🏕️',  native: 'Romani',      hint: 'Te rog, cher čhibakiri' },
};

export default function LanguageSelectScreen() {
  const [selected, setSelected] = useState<SupportedLanguage | null>(null);

  async function handleSelect(lang: SupportedLanguage) {
    setSelected(lang);
    setAppLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
    setTimeout(() => router.replace('/(auth)/login'), 220);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.star}>✦</Text>
          <Text style={styles.appName}>Maia's Voice</Text>
          <Text style={styles.tagline}>🌍  Wähle deine Sprache · Choose your language</Text>
        </View>

        <View style={styles.grid}>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const info = LANGUAGE_DATA[lang];
            const isOn = selected === lang;
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.card, isOn && styles.cardOn]}
                onPress={() => handleSelect(lang)}
                activeOpacity={0.75}
                accessibilityLabel={`${info.native} — ${info.hint}`}
                accessibilityRole="button"
              >
                <Text style={styles.flag}>{info.flag}</Text>
                <Text style={[styles.name, isOn && styles.nameOn]}>{info.native}</Text>
                {isOn && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.hint}>
          Du kannst die Sprache jederzeit in den Einstellungen ändern.{'\n'}
          You can change the language anytime in settings.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: C.bg },
  container: { flexGrow: 1, padding: 24, gap: 32, alignItems: 'center' },
  header:    { alignItems: 'center', gap: 10, paddingTop: 32 },
  star:      { fontSize: 52, color: C.gold },
  appName:   { fontSize: 30, fontWeight: '800', color: C.white, letterSpacing: 0.5 },
  tagline:   { fontSize: 15, color: C.textSec, marginTop: 2 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, justifyContent: 'center',
    width: '100%', maxWidth: 480,
  },
  card: {
    width: '45%',
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  cardOn:  { borderColor: C.gold, backgroundColor: C.surfaceUp },
  flag:    { fontSize: 34 },
  name:    { fontSize: 16, fontWeight: '700', color: C.white, textAlign: 'center' },
  nameOn:  { color: C.goldBright },
  check:   { fontSize: 18, color: C.gold, fontWeight: '800' },
  hint:    { color: C.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 320 },
});
