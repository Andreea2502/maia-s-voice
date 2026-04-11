import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { isGuestMode } from '@/lib/guest';
import { getCardById } from '@/lib/card-data';
import { DrawnCard } from '@/types/card';
import { C } from '@/lib/colors';

export default function InterpretationScreen() {
  const params = useLocalSearchParams<{
    spread_type: string; question: string;
    onboarding_summary: string; input_mode: string;
    reading_type: string; cards_json: string;
  }>();

  const [interpretation, setInterpretation] = useState('');
  const [readingId, setReadingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    generate();
  }, []);

  async function generate() {
    try {
      const guest = await isGuestMode();
      setGuestMode(guest);

      const cards: DrawnCard[] = JSON.parse(params.cards_json ?? '[]');

      if (guest) {
        // Build interpretation from local card data — no API needed
        const lines: string[] = [];
        const lang = typeof localStorage !== 'undefined'
          ? (localStorage.getItem('app_language') ?? 'de') : 'de';

        if (params.question) {
          lines.push(`🔮 "${params.question}"\n`);
        }

        lines.push('— — —\n');

        cards.forEach((drawn, i) => {
          const card = getCardById(drawn.cardId);
          if (!card) return;
          const name = card.nameTranslations[lang] ?? card.nameTranslations['en'] ?? card.nameTranslations['de'] ?? drawn.cardId;
          const meaning = drawn.orientation === 'upright'
            ? (card.meaningUpright[lang] ?? card.meaningUpright['en'] ?? card.meaningUpright['de'] ?? '')
            : (card.meaningReversed[lang] ?? card.meaningReversed['en'] ?? card.meaningReversed['de'] ?? '');
          const keywords = (card.keywords[lang] ?? card.keywords['en'] ?? card.keywords['de'] ?? []).join(' · ');
          const label = lang === 'de'
            ? ['Vergangenheit', 'Gegenwart', 'Zukunft'][i] ?? `Karte ${i + 1}`
            : ['Past', 'Present', 'Future'][i] ?? `Card ${i + 1}`;

          lines.push(`✦ ${label}: ${name} ${drawn.orientation === 'reversed' ? '(umgekehrt)' : ''}`);
          lines.push(meaning);
          if (keywords) lines.push(`${keywords}\n`);
        });

        lines.push('— — —');
        lines.push(lang === 'de'
          ? '✨ Dies ist eine Demo-Deutung. Erstelle ein Konto für Maias persönliche KI-Interpretation deiner Karten.'
          : '✨ This is a demo reading. Create an account for Maia\'s personal AI interpretation of your cards.');

        setInterpretation(lines.join('\n'));
        setReadingId('guest-demo');
      } else {
        // Full AI interpretation
        const { data: startData, error: startError } = await supabase.functions.invoke('reading-start', {
          body: {
            spread_type: params.spread_type ?? 'three_card',
            question: params.question,
            reading_type: params.reading_type ?? 'virtual',
            input_mode: params.input_mode ?? 'text',
          },
        });
        if (startError) throw startError;
        setReadingId(startData.reading_id);

        const { data: interpData, error: interpError } = await supabase.functions.invoke('reading-interpret', {
          body: {
            reading_id: startData.reading_id,
            cards,
            onboarding_summary: params.onboarding_summary ?? '',
            question: params.question ?? '',
            voice_used: params.input_mode === 'voice',
          },
        });
        if (interpError) throw interpError;
        setInterpretation(interpData.interpretation);
      }
    } catch (err: any) {
      setError(err.message ?? 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.gold} />
        <Text style={styles.loadingText}>
          {guestMode ? 'Karten werden gedeutet…' : 'Maia deutet deine Karten…'}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={generate}>
          <Text style={styles.retryBtnText}>Nochmal versuchen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.interpretationText}>{interpretation}</Text>

        {guestMode && (
          <TouchableOpacity
            style={styles.signupBanner}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.signupBannerTitle}>✨ Volle KI-Deutung freischalten</Text>
            <Text style={styles.signupBannerSub}>Jetzt kostenloses Konto erstellen →</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.doneBtn}
        onPress={() => {
          if (guestMode) {
            router.replace('/(tabs)/');
          } else {
            router.push({ pathname: '/reading/feedback', params: { reading_id: readingId } });
          }
        }}
      >
        <Text style={styles.doneBtnText}>
          {guestMode ? 'Zurück zur Startseite' : 'Weiter'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg, padding: 20, gap: 16 },
  center:      { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  scroll:      { flex: 1 },
  scrollContent: { gap: 20, paddingBottom: 20 },
  loadingText: { color: C.textSec, fontSize: 14, textAlign: 'center', maxWidth: 220 },
  errorText:   { color: C.error, textAlign: 'center' },
  retryBtn:    { backgroundColor: C.gold, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: C.bg, fontWeight: '700' },
  interpretationText: { color: C.textSec, fontSize: 16, lineHeight: 28 },
  signupBanner: {
    backgroundColor: C.surfaceUp,
    borderRadius: 16, borderWidth: 1.5, borderColor: C.gold + '88',
    padding: 20, alignItems: 'center', gap: 6, marginTop: 8,
  },
  signupBannerTitle: { color: C.white, fontSize: 16, fontWeight: '800' },
  signupBannerSub:   { color: C.goldBright, fontSize: 13 },
  doneBtn:     { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  doneBtnText: { color: C.bg, fontSize: 16, fontWeight: '800' },
});
