/**
 * Tarot Reading Screen — KI-Deutung anzeigen
 * Route: /tarot/reading?cards=JSON&spreadId=X&persona=X&...
 */
import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Animated, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C, MODULE_COLORS } from '@/lib/colors';
import { getPersonaById, PersonaId } from '@/lib/personas';
import { getSpreadById } from '@/lib/spreads';
import { useSupabase } from '@/hooks/useSupabase';
import { speak, stopSpeaking } from '@/lib/tts';

const mc = MODULE_COLORS.tarot;

interface DrawnCard {
  card_id: string;
  cardName: string;
  orientation: 'upright' | 'reversed';
  positionMeaning: string;
  positionLabel: string;
}

// ─── Card row in summary ─────────────────────────────────────
function CardRow({ card, accentColor }: { card: DrawnCard; accentColor: string }) {
  return (
    <View style={styles.cardRow}>
      <View style={[styles.cardRowAccent, { backgroundColor: accentColor + '22' }]}>
        <Text style={[styles.cardRowLabel, { color: accentColor }]}>{card.positionLabel}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardRowName}>„{card.cardName}"</Text>
        <Text style={styles.cardRowOri}>
          {card.orientation === 'upright' ? 'aufrecht' : 'umgekehrt'} · {card.positionMeaning}
        </Text>
      </View>
    </View>
  );
}

// ─── Interpretation section ──────────────────────────────────
function InterpretSection({ text }: { text: string }) {
  // Split by double newline into paragraphs
  const paragraphs = text.split(/\n\n+/).filter(Boolean);

  return (
    <View style={styles.interpretCard}>
      {paragraphs.map((para, i) => {
        // Detect headings (lines starting with ** or ##)
        const isHeading = para.startsWith('**') || para.startsWith('##');
        const clean = para.replace(/^\*\*|^\#\#\s?|\*\*$/g, '').trim();
        return isHeading ? (
          <Text key={i} style={styles.interpretHeading}>{clean}</Text>
        ) : (
          <Text key={i} style={styles.interpretPara}>{clean}</Text>
        );
      })}
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function ReadingScreen() {
  const supabase = useSupabase();
  const {
    cards: cardsParam,
    spreadId,
    spreadTitle,
    persona: personaParam,
    question,
    onboardingSummary,
  } = useLocalSearchParams<{
    cards: string;
    spreadId: string;
    spreadTitle: string;
    persona: string;
    question: string;
    onboardingSummary: string;
  }>();

  const persona   = getPersonaById((personaParam as PersonaId) ?? 'luna');
  const spread    = getSpreadById(spreadId ?? '');
  const cards: DrawnCard[] = cardsParam ? JSON.parse(cardsParam) : [];

  const [loading, setLoading]             = useState(true);
  const [interpretation, setInterpretation] = useState('');
  const [error, setError]                 = useState('');
  const [showCards, setShowCards]         = useState(false);
  const [ttsLoading, setTtsLoading]       = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchInterpretation();
  }, []);

  async function fetchInterpretation() {
    setLoading(true);
    setError('');
    try {
      // 1. Start reading (guest-safe)
      const { data: startData, error: startErr } = await supabase.functions.invoke('reading-start', {
        body: {
          spread_type: spreadId,
          reading_type: 'virtual',
          input_mode: 'text',
        },
      });
      if (startErr) throw startErr;

      // 2. Get interpretation
      const { data: interpretData, error: interpretErr } = await supabase.functions.invoke('reading-interpret', {
        body: {
          reading_id: startData?.reading_id,
          cards,
          onboarding_summary: onboardingSummary ?? '',
          question: question?.trim()
            || spread?.positions.map((p) => p.question).join(' / ')
            || '',
          spreadTitle: spread?.title ?? spreadTitle ?? '',
          persona_id: persona.id,
          voice_used: false,
        },
      });
      if (interpretErr) throw interpretErr;

      setInterpretation(interpretData.interpretation ?? '');

      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 800, useNativeDriver: true,
      }).start();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Deutung');
    } finally {
      setLoading(false);
    }
  }

  async function handleTTS() {
    if (!interpretation || ttsLoading) return;

    // Toggle: stop if already playing
    if (ttsLoading) { stopSpeaking(); setTtsLoading(false); return; }

    setTtsLoading(true);
    try {
      // Use reading-tts (persona voice) — falls back to ui-tts (master voice)
      const { data, error } = await supabase.functions.invoke('reading-tts', {
        body: {
          text: interpretation.slice(0, 2000),
          persona_id: persona.id,
        },
      });

      if (error || !data?.audio) {
        // Fallback: speak via lib/tts (ui-tts + browser fallback)
        await speak(interpretation.slice(0, 600));
        return;
      }

      const src = `data:${data.mime_type ?? 'audio/mpeg'};base64,${data.audio}`;

      if (typeof window !== 'undefined') {
        // Web
        const audio = new (window as any).Audio(src);
        audio.onended = () => setTtsLoading(false);
        await audio.play();
        return; // setTtsLoading handled by onended
      } else {
        // Native (expo-av)
        const { Audio } = await import('expo-av');
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync({ uri: src });
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) { setTtsLoading(false); sound.unloadAsync(); }
        });
        await sound.playAsync();
        return; // setTtsLoading handled by callback
      }
    } catch (_) {
      // silent fail
    } finally {
      // Only reset here if not handled by event
      setTtsLoading(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={persona.accentColor} />
        <Text style={[styles.loadingTitle, { color: persona.accentColor }]}>
          {persona.name.de} liest die Karten...
        </Text>
        <Text style={styles.loadingCards}>
          {cards.map((c) => `„${c.cardName}"`).join(' · ')}
        </Text>
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchInterpretation}>
          <Text style={[styles.retryText, { color: persona.accentColor }]}>Erneut versuchen</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/tarot')} style={{ marginTop: 8 }}>
          <Text style={styles.backText}>Zurück zum Tarot</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Reading ────────────────────────────────────────────────
  return (
    <Animated.ScrollView
      style={[styles.scroll, { opacity: fadeAnim }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Persona header */}
      <View style={[styles.personaHeader, { borderColor: persona.accentColor + '44' }]}>
        <View style={[styles.personaAvatar, { backgroundColor: persona.accentColor + '22' }]}>
          <Text style={[styles.personaInitial, { color: persona.accentColor }]}>
            {persona.name.de[0]}
          </Text>
        </View>
        <View>
          <Text style={styles.personaName}>{persona.name.de} spricht</Text>
          <Text style={styles.spreadName}>
            {spread?.icon} {spreadTitle || spread?.title}
          </Text>
        </View>
        {/* TTS Button */}
        <TouchableOpacity
          style={[styles.ttsBtn, { borderColor: persona.accentColor + '55' }]}
          onPress={handleTTS}
          activeOpacity={0.7}
        >
          <Text style={[styles.ttsBtnText, { color: persona.accentColor }]}>
            {ttsLoading ? '...' : '▶ Vorlesen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Cards drawn — collapsible */}
      <TouchableOpacity
        style={styles.cardsSummaryHeader}
        onPress={() => setShowCards(!showCards)}
        activeOpacity={0.7}
      >
        <Text style={styles.cardsSummaryTitle}>
          {showCards ? '▲' : '▼'} Gezogene Karten ({cards.length})
        </Text>
      </TouchableOpacity>
      {showCards && (
        <View style={styles.cardsList}>
          {cards.map((c, i) => (
            <CardRow key={i} card={c} accentColor={persona.accentColor} />
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: persona.accentColor + '44' }]} />

      {/* Interpretation */}
      <InterpretSection text={interpretation} />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: persona.accentColor + '66' }]}
          onPress={() => router.replace('/tarot/spread-select' as any)}
          activeOpacity={0.85}
        >
          <Text style={[styles.actionBtnText, { color: persona.accentColor }]}>
            Neue Legung ✦
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtnSec}
          onPress={() => router.replace('/tarot')}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnSecText}>Leserin wechseln</Text>
        </TouchableOpacity>
      </View>
    </Animated.ScrollView>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll:  { flex: 1, backgroundColor: mc.bg },
  content: { padding: 20, gap: 16, paddingBottom: 100 },

  center: {
    flex: 1, backgroundColor: mc.bg,
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 28,
  },
  loadingTitle: { fontSize: 17, fontWeight: '700', marginTop: 16 },
  loadingCards: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  errorIcon:    { fontSize: 36 },
  errorText:    { color: C.error, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn:     { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: mc.surface, marginTop: 8 },
  retryText:    { fontWeight: '700', fontSize: 14 },
  backText:     { color: C.textMuted, fontSize: 13 },

  // Persona header
  personaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: mc.surface, borderRadius: 16,
    borderWidth: 1, padding: 14,
  },
  personaAvatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  personaInitial: { fontSize: 18, fontWeight: '800' },
  personaName:    { fontSize: 14, fontWeight: '700', color: C.white },
  spreadName:     { fontSize: 12, color: C.textSec },
  ttsBtn: {
    marginLeft: 'auto',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1.5,
  },
  ttsBtnText: { fontSize: 12, fontWeight: '700' },

  // Cards list
  cardsSummaryHeader: {
    paddingVertical: 10, paddingHorizontal: 14,
    backgroundColor: mc.surface, borderRadius: 12,
    borderWidth: 1, borderColor: mc.border,
  },
  cardsSummaryTitle: { color: C.textSec, fontSize: 13, fontWeight: '600' },
  cardsList: {
    backgroundColor: mc.surface, borderRadius: 12,
    borderWidth: 1, borderColor: mc.border, overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderBottomWidth: 1, borderBottomColor: mc.border + '55',
  },
  cardRowAccent: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardRowLabel:  { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  cardRowName:   { fontSize: 14, fontWeight: '700', color: C.white },
  cardRowOri:    { fontSize: 11, color: C.textMuted, marginTop: 2 },

  divider: { height: 1.5, marginVertical: 4 },

  // Interpretation
  interpretCard: {
    backgroundColor: mc.surface, borderRadius: 16,
    borderWidth: 1, borderColor: mc.border,
    padding: 20, gap: 12,
  },
  interpretHeading: {
    fontSize: 15, fontWeight: '800', color: C.white,
    marginTop: 8, letterSpacing: 0.3,
  },
  interpretPara: {
    fontSize: 15, color: C.textSec, lineHeight: 24,
  },

  // Actions
  actions: { gap: 10, marginTop: 8 },
  actionBtn: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2,
    backgroundColor: mc.surface,
  },
  actionBtnText: { fontSize: 15, fontWeight: '800' },
  actionBtnSec: {
    borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', backgroundColor: mc.surface,
    borderWidth: 1, borderColor: mc.border,
  },
  actionBtnSecText: { color: C.textSec, fontSize: 14, fontWeight: '600' },
});
