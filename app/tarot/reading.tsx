/**
 * Tarot Reading Screen — strukturierte KI-Deutung mit schönem Layout
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

// ─── Types ───────────────────────────────────────────────────
interface DrawnCard {
  card_id: string;
  cardName: string;
  orientation: 'upright' | 'reversed';
  positionMeaning: string;
  positionLabel: string;
}

interface StructuredCard {
  name: string;
  position: string;
  orientation: string;
  interpretation: string;
  classic_meaning: string;
  anecdote: string;
}

interface StructuredReading {
  opening: string;
  cards: StructuredCard[];
  synthesis: string;
  core_message: string;
  questions: string[];
}

// ─── Single card detail with expandable classic meaning ───────
function CardDetail({
  card,
  index,
  accentColor,
}: {
  card: StructuredCard;
  index: number;
  accentColor: string;
}) {
  const [showClassic, setShowClassic] = useState(false);
  const isUpright = card.orientation === 'aufrecht' || card.orientation === 'upright';

  return (
    <View style={[cd.wrap, { borderColor: accentColor + '33' }]}>
      {/* Card header */}
      <View style={cd.header}>
        <View style={[cd.indexBadge, { backgroundColor: accentColor + '22' }]}>
          <Text style={[cd.indexNum, { color: accentColor }]}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cd.cardName}>{card.name}</Text>
          <Text style={cd.positionText}>{card.position}</Text>
        </View>
        <View style={[cd.oriBadge, { backgroundColor: isUpright ? accentColor + '15' : '#FF6B6B22' }]}>
          <Text style={[cd.oriText, { color: isUpright ? accentColor : '#FF6B6B' }]}>
            {isUpright ? '↑ aufrecht' : '↓ umgekehrt'}
          </Text>
        </View>
      </View>

      {/* Interpretation */}
      <Text style={cd.interpretation}>{card.interpretation}</Text>

      {/* Toggle for classic meaning */}
      <TouchableOpacity
        style={[cd.toggle, { borderColor: accentColor + '44' }]}
        onPress={() => setShowClassic(!showClassic)}
        activeOpacity={0.7}
      >
        <Text style={[cd.toggleText, { color: accentColor }]}>
          {showClassic ? '▲ Ausblenden' : '✦ Klassische Bedeutung & Anekdote'}
        </Text>
      </TouchableOpacity>

      {/* Classic meaning + anecdote */}
      {showClassic && (
        <View style={[cd.classicBox, { borderColor: accentColor + '22' }]}>
          <Text style={cd.classicLabel}>KLASSISCHE BEDEUTUNG</Text>
          <Text style={cd.classicText}>{card.classic_meaning}</Text>
          {!!card.anecdote && (
            <>
              <View style={[cd.anecdoteDivider, { backgroundColor: accentColor + '33' }]} />
              <Text style={[cd.anecdoteLabel, { color: accentColor }]}>✦ Wusstest du?</Text>
              <Text style={cd.anecdoteText}>{card.anecdote}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Structured reading view ──────────────────────────────────
function StructuredReadingView({
  structured,
  accentColor,
}: {
  structured: StructuredReading;
  accentColor: string;
}) {
  return (
    <View style={sr.root}>
      {/* Opening */}
      <View style={[sr.openingBox, { borderColor: accentColor + '55' }]}>
        <Text style={[sr.openingAccent, { color: accentColor }]}>✦</Text>
        <Text style={sr.openingText}>{structured.opening}</Text>
      </View>

      {/* Cards overview table */}
      {structured.cards?.length > 0 && (
        <View style={sr.tableWrap}>
          <Text style={sr.sectionLabel}>KARTEN-ÜBERSICHT</Text>
          <View style={[sr.table, { borderColor: accentColor + '33' }]}>
            {structured.cards.map((c, i) => {
              const isUpright = c.orientation === 'aufrecht' || c.orientation === 'upright';
              return (
                <View
                  key={i}
                  style={[sr.tableRow, i < structured.cards.length - 1 && { borderBottomWidth: 1, borderBottomColor: accentColor + '22' }]}
                >
                  <Text style={[sr.tableNum, { color: accentColor }]}>{i + 1}</Text>
                  <Text style={sr.tableName} numberOfLines={1}>{c.name}</Text>
                  <Text style={sr.tablePos} numberOfLines={1}>{c.position}</Text>
                  <Text style={[sr.tableOri, { color: isUpright ? accentColor : '#FF6B6B' }]}>
                    {isUpright ? '↑' : '↓'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Card-by-card interpretation */}
      {structured.cards?.length > 0 && (
        <View style={sr.cardsSection}>
          <Text style={sr.sectionLabel}>KARTEN-DEUTUNG</Text>
          {structured.cards.map((c, i) => (
            <CardDetail key={i} card={c} index={i} accentColor={accentColor} />
          ))}
        </View>
      )}

      {/* Synthesis */}
      {!!structured.synthesis && (
        <View style={[sr.synthesisBox, { borderLeftColor: accentColor }]}>
          <Text style={[sr.synthesisLabel, { color: accentColor }]}>Zusammenschau</Text>
          <Text style={sr.synthesisText}>{structured.synthesis}</Text>
        </View>
      )}

      {/* Core message */}
      {!!structured.core_message && (
        <View style={[sr.coreBox, { backgroundColor: accentColor + '12', borderColor: accentColor + '55' }]}>
          <Text style={[sr.coreLabel, { color: accentColor }]}>✦ Kernbotschaft</Text>
          <Text style={sr.coreText}>{structured.core_message}</Text>
        </View>
      )}

      {/* Reflection questions */}
      {structured.questions?.length > 0 && (
        <View style={sr.questionsWrap}>
          <Text style={sr.sectionLabel}>ZUM NACHDENKEN</Text>
          {structured.questions.map((q, i) => (
            <View key={i} style={[sr.questionRow, { borderColor: accentColor + '33' }]}>
              <Text style={[sr.questionNum, { color: accentColor }]}>{i + 1}</Text>
              <Text style={sr.questionText}>{q}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Fallback plain-text renderer (if JSON parse fails) ───────
function PlainInterpretSection({ text }: { text: string }) {
  const blocks = text.split(/\n\n+/).filter(Boolean);
  return (
    <View style={styles.interpretCard}>
      {blocks.map((block, i) => {
        const clean = block.replace(/\*\*/g, '').replace(/^#+\s?/, '').trim();
        const isHeading = block.startsWith('#') || /^[A-ZÄÖÜ][^.!?]{0,40}:/.test(block);
        return isHeading ? (
          <Text key={i} style={styles.interpretHeading}>{clean}</Text>
        ) : (
          <Text key={i} style={styles.interpretPara}>{clean}</Text>
        );
      })}
    </View>
  );
}

// ─── Card row in collapsible drawer ──────────────────────────
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

  const [loading, setLoading]                 = useState(true);
  const [interpretation, setInterpretation]   = useState('');
  const [structured, setStructured]           = useState<StructuredReading | null>(null);
  const [error, setError]                     = useState('');
  const [showCards, setShowCards]             = useState(false);
  const [ttsLoading, setTtsLoading]           = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchInterpretation();
  }, []);

  async function fetchInterpretation() {
    setLoading(true);
    setError('');
    try {
      const { data: startData, error: startErr } = await supabase.functions.invoke('reading-start', {
        body: { spread_type: spreadId, reading_type: 'virtual', input_mode: 'text' },
      });
      if (startErr) throw startErr;

      const { data: interpretData, error: interpretErr } = await supabase.functions.invoke('reading-interpret', {
        body: {
          reading_id: startData?.reading_id,
          cards,
          onboarding_summary: onboardingSummary ?? '',
          question: question?.trim() || spread?.positions.map((p) => p.question).join(' / ') || '',
          spreadTitle: spread?.title ?? spreadTitle ?? '',
          persona_id: persona.id,
          voice_used: false,
        },
      });
      if (interpretErr) throw interpretErr;

      setInterpretation(interpretData.interpretation ?? '');
      setStructured(interpretData.structured ?? null);

      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Deutung');
    } finally {
      setLoading(false);
    }
  }

  async function handleTTS() {
    if (!interpretation || ttsLoading) return;
    setTtsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('reading-tts', {
        body: { text: interpretation.slice(0, 2000), persona_id: persona.id },
      });

      if (error || !data?.audio) {
        await speak(interpretation.slice(0, 600));
        setTtsLoading(false);
        return;
      }

      const src = `data:${data.mime_type ?? 'audio/mpeg'};base64,${data.audio}`;

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const audio = new (window as any).Audio(src);
        audio.onended = () => setTtsLoading(false);
        await audio.play();
      } else {
        const { Audio } = await import('expo-av');
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync({ uri: src });
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (status.didJustFinish) { setTtsLoading(false); sound.unloadAsync(); }
        });
        await sound.playAsync();
      }
    } catch (_) {
      setTtsLoading(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────
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
        <Text style={styles.loadingHint}>Tiefgang braucht einen Moment ✦</Text>
      </View>
    );
  }

  // ── Error ──────────────────────────────────────────────────
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
        <View style={{ flex: 1 }}>
          <Text style={styles.personaName}>{persona.name.de} spricht</Text>
          <Text style={styles.spreadName}>
            {spread?.icon} {spreadTitle || spread?.title}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.ttsBtn, { borderColor: persona.accentColor + '55' }]}
          onPress={handleTTS}
          activeOpacity={0.7}
        >
          <Text style={[styles.ttsBtnText, { color: persona.accentColor }]}>
            {ttsLoading ? '⏹' : '▶ Vorlesen'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible drawn cards */}
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

      {/* Interpretation — structured or fallback */}
      {structured ? (
        <StructuredReadingView structured={structured} accentColor={persona.accentColor} />
      ) : (
        <PlainInterpretSection text={interpretation} />
      )}

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
  content: { padding: 20, gap: 14, paddingBottom: 100 },

  center: {
    flex: 1, backgroundColor: mc.bg,
    alignItems: 'center', justifyContent: 'center',
    gap: 12, padding: 28,
  },
  loadingTitle: { fontSize: 17, fontWeight: '700', marginTop: 16 },
  loadingCards: { fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
  loadingHint:  { fontSize: 12, color: C.textMuted, marginTop: 4, fontStyle: 'italic' },
  errorIcon:    { fontSize: 36 },
  errorText:    { color: C.error, fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn:     { paddingVertical: 10, paddingHorizontal: 24, borderRadius: 10, backgroundColor: mc.surface, marginTop: 8 },
  retryText:    { fontWeight: '700', fontSize: 14 },
  backText:     { color: C.textMuted, fontSize: 13 },

  personaHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: mc.surface, borderRadius: 16, borderWidth: 1, padding: 14,
  },
  personaAvatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  personaInitial: { fontSize: 18, fontWeight: '800' },
  personaName:    { fontSize: 14, fontWeight: '700', color: C.white },
  spreadName:     { fontSize: 12, color: C.textSec },
  ttsBtn: {
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 10, borderWidth: 1.5,
  },
  ttsBtnText: { fontSize: 12, fontWeight: '700' },

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

  divider: { height: 1.5, marginVertical: 2 },

  // Fallback plain-text interpretation
  interpretCard: {
    backgroundColor: mc.surface, borderRadius: 16,
    borderWidth: 1, borderColor: mc.border, padding: 20, gap: 12,
  },
  interpretHeading: { fontSize: 15, fontWeight: '800', color: C.white, marginTop: 8, letterSpacing: 0.3 },
  interpretPara:    { fontSize: 15, color: C.textSec, lineHeight: 24 },

  actions: { gap: 10, marginTop: 8 },
  actionBtn: {
    borderRadius: 16, paddingVertical: 16,
    alignItems: 'center', borderWidth: 2, backgroundColor: mc.surface,
  },
  actionBtnText: { fontSize: 15, fontWeight: '800' },
  actionBtnSec: {
    borderRadius: 16, paddingVertical: 14,
    alignItems: 'center', backgroundColor: mc.surface,
    borderWidth: 1, borderColor: mc.border,
  },
  actionBtnSecText: { color: C.textSec, fontSize: 14, fontWeight: '600' },
});

// ─── Structured view styles ───────────────────────────────────
const sr = StyleSheet.create({
  root: { gap: 16 },

  openingBox: {
    backgroundColor: mc.surface, borderRadius: 16,
    borderWidth: 1.5, padding: 20, gap: 10,
    alignItems: 'flex-start',
  },
  openingAccent: { fontSize: 22 },
  openingText:   { fontSize: 16, color: C.white, lineHeight: 25, fontWeight: '500' },

  tableWrap: { gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.8 },
  table: {
    backgroundColor: mc.surface, borderRadius: 14,
    borderWidth: 1, overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 11,
  },
  tableNum:  { fontSize: 13, fontWeight: '800', color: C.textMuted, width: 20, textAlign: 'center' },
  tableName: { flex: 2, fontSize: 13, fontWeight: '700', color: C.white },
  tablePos:  { flex: 2, fontSize: 11, color: C.textSec },
  tableOri:  { fontSize: 16, fontWeight: '800', width: 20, textAlign: 'right' },

  cardsSection: { gap: 10 },

  synthesisBox: {
    backgroundColor: mc.surface, borderRadius: 14,
    borderWidth: 1, borderColor: mc.border,
    borderLeftWidth: 4, padding: 16, gap: 6,
  },
  synthesisLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  synthesisText:  { fontSize: 14, color: C.textSec, lineHeight: 22 },

  coreBox: {
    borderRadius: 16, borderWidth: 1.5,
    padding: 18, gap: 8,
  },
  coreLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 0.5 },
  coreText:  { fontSize: 15, color: C.white, lineHeight: 24, fontWeight: '500' },

  questionsWrap: { gap: 10 },
  questionRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: mc.surface, borderRadius: 12,
    borderWidth: 1, padding: 14,
  },
  questionNum:  { fontSize: 16, fontWeight: '800', width: 20, textAlign: 'center', marginTop: 1 },
  questionText: { flex: 1, fontSize: 14, color: C.textSec, lineHeight: 21, fontStyle: 'italic' },
});

// ─── Card detail styles ───────────────────────────────────────
const cd = StyleSheet.create({
  wrap: {
    backgroundColor: mc.surface, borderRadius: 16,
    borderWidth: 1, padding: 16, gap: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  indexBadge: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  indexNum:    { fontSize: 15, fontWeight: '900' },
  cardName:    { fontSize: 15, fontWeight: '800', color: C.white },
  positionText:{ fontSize: 11, color: C.textMuted, marginTop: 1 },

  oriBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  oriText: { fontSize: 11, fontWeight: '700' },

  interpretation: { fontSize: 14, color: C.textSec, lineHeight: 22 },

  toggle: {
    alignSelf: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: 8, borderWidth: 1,
  },
  toggleText: { fontSize: 12, fontWeight: '700' },

  classicBox: {
    backgroundColor: C.bg + 'aa', borderRadius: 12,
    borderWidth: 1, padding: 14, gap: 8,
  },
  classicLabel:      { fontSize: 10, fontWeight: '800', color: C.textMuted, letterSpacing: 1.5 },
  classicText:       { fontSize: 13, color: C.textSec, lineHeight: 20 },
  anecdoteDivider:   { height: 1, marginVertical: 4 },
  anecdoteLabel:     { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  anecdoteText:      { fontSize: 13, color: C.textSec, lineHeight: 20, fontStyle: 'italic' },
});
