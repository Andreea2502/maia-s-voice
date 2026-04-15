/**
 * Tarot Draw Screen — Karten ziehen
 * Route: /tarot/draw?spreadId=X&persona=X&onboardingSummary=...
 *
 * User tippt auf jede Position → Karte wird "gezogen" (aufgedeckt)
 * Nach allen Karten → "Deutung erhalten"
 */
import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Dimensions, Platform, TextInput, KeyboardAvoidingView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C, MODULE_COLORS } from '@/lib/colors';
import { getPersonaById, PersonaId } from '@/lib/personas';
import { getSpreadById } from '@/lib/spreads';

const mc = MODULE_COLORS.tarot;
const { width: W } = Dimensions.get('window');
const CARD_W = Math.min((W - 64) / 3, 100);
const CARD_H = CARD_W * 1.65;

// ─── Volles 78-Karten Tarot-Deck ────────────────────────────
// 22 Major Arcana + 56 Minor Arcana (4 Farben × 14 Karten)

const MAJOR_ARCANA = [
  { id: 'major_00', name: 'Der Narr',               emoji: '🌟' },
  { id: 'major_01', name: 'Der Magier',              emoji: '✨' },
  { id: 'major_02', name: 'Die Hohepriesterin',      emoji: '🌙' },
  { id: 'major_03', name: 'Die Herrscherin',         emoji: '🌿' },
  { id: 'major_04', name: 'Der Herrscher',           emoji: '🏔️' },
  { id: 'major_05', name: 'Der Hierophant',          emoji: '🔑' },
  { id: 'major_06', name: 'Die Liebenden',           emoji: '❤️' },
  { id: 'major_07', name: 'Der Wagen',               emoji: '🏇' },
  { id: 'major_08', name: 'Die Stärke',              emoji: '🦁' },
  { id: 'major_09', name: 'Der Einsiedler',          emoji: '🕯️' },
  { id: 'major_10', name: 'Das Rad des Schicksals',  emoji: '☸️' },
  { id: 'major_11', name: 'Die Gerechtigkeit',       emoji: '⚖️' },
  { id: 'major_12', name: 'Der Gehängte',            emoji: '🙃' },
  { id: 'major_13', name: 'Der Tod',                 emoji: '🌑' },
  { id: 'major_14', name: 'Die Mäßigkeit',           emoji: '🌈' },
  { id: 'major_15', name: 'Der Teufel',              emoji: '🔗' },
  { id: 'major_16', name: 'Der Turm',                emoji: '⚡' },
  { id: 'major_17', name: 'Der Stern',               emoji: '⭐' },
  { id: 'major_18', name: 'Der Mond',                emoji: '🌕' },
  { id: 'major_19', name: 'Die Sonne',               emoji: '☀️' },
  { id: 'major_20', name: 'Das Gericht',             emoji: '🎺' },
  { id: 'major_21', name: 'Die Welt',                emoji: '🌍' },
];

function buildSuit(
  suitId: string,
  suitName: string,
  emoji: string
) {
  const ranks = [
    { rank: 'ace',    label: 'Ass' },
    { rank: '02',     label: 'Zwei' },
    { rank: '03',     label: 'Drei' },
    { rank: '04',     label: 'Vier' },
    { rank: '05',     label: 'Fünf' },
    { rank: '06',     label: 'Sechs' },
    { rank: '07',     label: 'Sieben' },
    { rank: '08',     label: 'Acht' },
    { rank: '09',     label: 'Neun' },
    { rank: '10',     label: 'Zehn' },
    { rank: 'page',   label: 'Page' },
    { rank: 'knight', label: 'Ritter' },
    { rank: 'queen',  label: 'Königin' },
    { rank: 'king',   label: 'König' },
  ];
  return ranks.map(({ rank, label }) => ({
    id:    `${suitId}_${rank}`,
    name:  `${label} der ${suitName}`,
    emoji,
  }));
}

// 56 Minor Arcana — 4 Farben
const MINOR_ARCANA = [
  ...buildSuit('wands',     'Stäbe',    '🔥'),  // Feuer — Energie, Kreativität, Karriere
  ...buildSuit('cups',      'Kelche',   '💧'),  // Wasser — Gefühle, Beziehungen, Intuition
  ...buildSuit('swords',    'Schwerter','💨'),  // Luft — Gedanken, Konflikt, Wahrheit
  ...buildSuit('pentacles', 'Münzen',   '🌱'),  // Erde — Geld, Körper, Materialität
];

// Vollständiges 78-Karten-Deck
const FULL_DECK = [...MAJOR_ARCANA, ...MINOR_ARCANA]; // 78 Karten

function drawRandomCards(count: number) {
  const shuffled = [...FULL_DECK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((card) => ({
    ...card,
    orientation: Math.random() > 0.25 ? 'upright' : 'reversed' as const,
  }));
}

// ─── Single card tile ────────────────────────────────────────
interface DrawnCard {
  id: string;
  name: string;
  emoji: string;
  orientation: 'upright' | 'reversed';
}

function CardTile({
  position,
  card,
  index,
  accentColor,
  onDraw,
}: {
  position: { label: string };
  card: DrawnCard | null;
  index: number;
  accentColor: string;
  onDraw: (index: number) => void;
}) {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [flipped, setFlipped] = useState(false);

  function handlePress() {
    if (flipped || card) return;
    Animated.spring(flipAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start(() => {
      setFlipped(true);
      onDraw(index);
    });
  }

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '90deg', '0deg'],
  });
  const bgColor = flipAnim.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [mc.border, mc.border, accentColor + '33', accentColor + '33'],
  });

  return (
    <View style={styles.cardSlot}>
      <Text style={styles.posLabel} numberOfLines={1}>{position.label}</Text>
      <TouchableOpacity onPress={handlePress} activeOpacity={card ? 1 : 0.7}>
        <Animated.View
          style={[
            styles.card,
            {
              width: CARD_W,
              height: CARD_H,
              backgroundColor: bgColor as any,
              borderColor: card ? accentColor : mc.border,
              transform: [{ rotateY: frontRotate }],
            },
          ]}
        >
          {card ? (
            <View style={styles.cardFront}>
              <Text style={[
                styles.cardEmoji,
                card.orientation === 'reversed' && { transform: [{ rotate: '180deg' }] },
              ]}>
                {card.emoji}
              </Text>
              <Text style={[styles.cardName, { color: accentColor }]} numberOfLines={2}>
                {card.name}
              </Text>
              {card.orientation === 'reversed' && (
                <Text style={styles.reversedBadge}>umgekehrt</Text>
              )}
            </View>
          ) : (
            <View style={styles.cardBack}>
              <Text style={styles.cardBackSymbol}>✦</Text>
              <Text style={styles.cardBackHint}>tippen</Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────
export default function DrawScreen() {
  const { spreadId, persona: personaParam, onboardingSummary } =
    useLocalSearchParams<{ spreadId: string; persona: string; onboardingSummary: string }>();

  const persona   = getPersonaById((personaParam as PersonaId) ?? 'luna');
  const spread    = getSpreadById(spreadId ?? 'day_card');
  const [question, setQuestion]     = useState('');
  const [questionSet, setQuestionSet] = useState(false);
  const [drawnCards, setDrawnCards] = useState<(DrawnCard | null)[]>(
    () => new Array(spread?.cardCount ?? 1).fill(null)
  );
  const [deck] = useState(() => drawRandomCards(spread?.cardCount ?? 1));

  const allDrawn = drawnCards.every((c) => c !== null);

  const handleDraw = useCallback((index: number) => {
    setDrawnCards((prev) => {
      const next = [...prev];
      next[index] = deck[index];
      return next;
    });
  }, [deck]);

  function confirmQuestion() {
    setQuestionSet(true);
  }

  function goToReading() {
    const cards = drawnCards.filter(Boolean).map((c, i) => ({
      card_id: c!.id,
      cardName: c!.name,
      orientation: c!.orientation,
      positionMeaning: spread?.positions[i]?.question ?? `Position ${i + 1}`,
      positionLabel: spread?.positions[i]?.label ?? `${i + 1}`,
    }));

    router.push({
      pathname: '/tarot/reading' as any,
      params: {
        cards: JSON.stringify(cards),
        spreadId: spreadId ?? 'day_card',
        spreadTitle: spread?.title ?? '',
        persona: persona.id,
        question: question.trim(),
        onboardingSummary: onboardingSummary ?? '',
      },
    });
  }

  if (!spread) return null;

  const drawnCount = drawnCards.filter(Boolean).length;

  // ── Step 1: Frage eingeben ────────────────────────────────
  if (!questionSet) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.glow, { backgroundColor: persona.accentColor }]} />
        <ScrollView contentContainerStyle={styles.questionScreen}>
          <Text style={[styles.spreadTitle, { color: persona.accentColor }]}>
            {spread.icon} {spread.title}
          </Text>
          <Text style={styles.spreadSub}>{spread.subtitle}</Text>

          <View style={styles.questionBox}>
            <Text style={styles.questionLabel}>
              Was beschäftigt dich gerade?
            </Text>
            <Text style={styles.questionHint}>
              Je konkreter deine Frage, desto persönlicher die Deutung.
            </Text>
            <TextInput
              style={styles.questionInput}
              placeholder={`z.B. "Ich mache mir Sorgen um meine Beziehung..."`}
              placeholderTextColor={C.textMuted}
              value={question}
              onChangeText={setQuestion}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />
          </View>

          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: persona.accentColor }]}
            onPress={confirmQuestion}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Karten ziehen ✦</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmQuestion} style={styles.skipQuestion}>
            <Text style={styles.skipQuestionText}>Ohne Frage fortfahren</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.root}>
      {/* Ambient glow */}
      <View style={[styles.glow, { backgroundColor: persona.accentColor }]} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.spreadTitle, { color: persona.accentColor }]}>
          {spread.icon} {spread.title}
        </Text>
        {question ? (
          <Text style={styles.questionPreview} numberOfLines={2}>„{question}"</Text>
        ) : (
          <Text style={styles.spreadSub}>{spread.subtitle}</Text>
        )}
        <Text style={styles.progress}>
          {drawnCount} / {spread.cardCount} Karten gezogen
        </Text>
      </View>

      {/* Cards grid */}
      <ScrollView
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
      >
        {spread.positions.map((pos, i) => (
          <CardTile
            key={i}
            index={i}
            position={pos}
            card={drawnCards[i]}
            accentColor={persona.accentColor}
            onDraw={handleDraw}
          />
        ))}
      </ScrollView>

      {/* CTA */}
      <View style={styles.footer}>
        {allDrawn ? (
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: persona.accentColor }]}
            onPress={goToReading}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaBtnText}>Deutung erhalten ✦</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.hintBox}>
            <Text style={styles.hintText}>
              Tippe auf jede Karte um sie zu ziehen
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: mc.bg },
  glow: {
    position: 'absolute', top: -60, left: '50%', marginLeft: -100,
    width: 200, height: 200, borderRadius: 100, opacity: 0.08,
  },

  header: { alignItems: 'center', paddingTop: 20, paddingHorizontal: 24, gap: 4, paddingBottom: 12 },
  spreadTitle: { fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  spreadSub:   { fontSize: 13, color: C.textSec },
  progress:    { fontSize: 12, color: C.textMuted, marginTop: 4 },

  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 12,
    paddingHorizontal: 16, paddingBottom: 120,
  },

  cardSlot:  { alignItems: 'center', gap: 6 },
  posLabel:  { fontSize: 11, color: C.textMuted, maxWidth: CARD_W, textAlign: 'center' },

  card: {
    borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  cardBack: { alignItems: 'center', gap: 6 },
  cardBackSymbol: { fontSize: 24, color: mc.primary, opacity: 0.6 },
  cardBackHint:   { fontSize: 10, color: C.textMuted, letterSpacing: 1 },

  cardFront: { alignItems: 'center', padding: 8, gap: 6 },
  cardEmoji: { fontSize: 28 },
  cardName:  { fontSize: 11, fontWeight: '700', textAlign: 'center', lineHeight: 15 },
  reversedBadge: { fontSize: 9, color: C.textMuted, letterSpacing: 0.5 },

  // Question screen
  questionScreen:  { padding: 24, gap: 20, paddingTop: 40, paddingBottom: 60 },
  questionBox: {
    backgroundColor: mc.surface, borderRadius: 18,
    borderWidth: 1.5, borderColor: mc.border, padding: 20, gap: 12,
  },
  questionLabel: { fontSize: 17, fontWeight: '800', color: C.white },
  questionHint:  { fontSize: 13, color: C.textSec, lineHeight: 19 },
  questionInput: {
    backgroundColor: mc.bg, borderRadius: 12,
    borderWidth: 1.5, borderColor: mc.border,
    color: C.white, fontSize: 15, lineHeight: 22,
    padding: 14, minHeight: 100,
  },
  skipQuestion:     { alignItems: 'center', paddingVertical: 8 },
  skipQuestionText: { color: C.textMuted, fontSize: 13 },
  questionPreview:  { fontSize: 13, color: C.textSec, fontStyle: 'italic', textAlign: 'center' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: mc.bg,
    borderTopWidth: 1, borderTopColor: mc.border,
  },
  ctaBtn:     { borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  ctaBtnText: { color: C.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  hintBox:    { alignItems: 'center', paddingVertical: 12 },
  hintText:   { color: C.textMuted, fontSize: 13 },
});
