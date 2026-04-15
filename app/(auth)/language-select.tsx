import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAppLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { SupportedLanguage } from '@/types/user';
import { C } from '@/lib/colors';
import { CosmicBackground } from '@/components/ui/CosmicBackground';

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
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  async function handleSelect(lang: SupportedLanguage) {
    setSelected(lang);
    setAppLanguage(lang);
    await AsyncStorage.setItem('app_language', lang);
    setTimeout(() => router.replace('/(auth)/login'), 280);
  }

  return (
    <CosmicBackground starCount={55}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.inner, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

          {/* Logo */}
          <View style={styles.logoWrap}>
            <View style={styles.logoOrb}>
              <Text style={styles.logoStar}>✦</Text>
            </View>
            <Text style={styles.appName}>MYSTIC</Text>
            <Text style={styles.tagline}>Wähle deine Sprache</Text>
            <Text style={styles.taglineSub}>Choose your language</Text>
          </View>

          {/* Grid */}
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
                >
                  <Text style={styles.flag}>{info.flag}</Text>
                  <Text style={[styles.langName, isOn && styles.langNameOn]}>{info.native}</Text>
                  {isOn && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.hint}>
            Du kannst die Sprache jederzeit in den Einstellungen ändern.
          </Text>

        </Animated.View>
      </ScrollView>
    </CosmicBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 48 },
  inner:  { gap: 32, alignItems: 'center', maxWidth: 480, alignSelf: 'center', width: '100%' },

  logoWrap: { alignItems: 'center', gap: 10, paddingTop: 40 },
  logoOrb: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1.5, borderColor: C.gold + '55',
    backgroundColor: C.gold + '0F',
    alignItems: 'center', justifyContent: 'center',
  },
  logoStar:   { fontSize: 40, color: C.gold },
  appName:    { fontSize: 32, fontWeight: '900', color: C.white, letterSpacing: 8 },
  tagline:    { fontSize: 16, color: C.textSec, fontWeight: '600' },
  taglineSub: { fontSize: 13, color: C.textMuted },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, justifyContent: 'center', width: '100%',
  },
  card: {
    width: '45%',
    backgroundColor: '#FFFFFF08',
    borderWidth: 1.5,
    borderColor: '#FFFFFF14',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  cardOn: {
    borderColor: C.gold,
    backgroundColor: C.gold + '14',
  },
  flag:       { fontSize: 36 },
  langName:   { fontSize: 15, fontWeight: '700', color: C.textSec, textAlign: 'center' },
  langNameOn: { color: C.gold },
  checkBadge: {
    position: 'absolute', top: 8, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center',
  },
  checkText: { color: C.bg, fontSize: 12, fontWeight: '900' },

  hint: { color: C.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
});
