/**
 * Spread Selection — pick a reading format after persona onboarding
 * Route: /tarot/spread-select?persona=luna&onboardingSummary=...
 * Shows 17 spreads grouped by category with premium locks.
 */
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, FlatList, Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C, MODULE_COLORS } from '@/lib/colors';
import { getPersonaById, PersonaId } from '@/lib/personas';
import {
  SPREADS_BY_CATEGORY, CATEGORY_META, SpreadCategory, Spread,
} from '@/lib/spreads';

const mc = MODULE_COLORS.tarot;
const { width: W } = Dimensions.get('window');

const CATEGORIES: SpreadCategory[] = ['daily', 'decisions', 'love', 'depth'];

// ─── Category pill ─────────────────────────────────────────────
function CategoryPill({
  cat, active, onPress,
}: { cat: SpreadCategory; active: boolean; onPress: () => void }) {
  const meta = CATEGORY_META[cat];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={styles.pillIcon}>{meta.icon}</Text>
      <Text style={[styles.pillLabel, active && styles.pillLabelActive]}>
        {meta.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Spread card ───────────────────────────────────────────────
function SpreadCard({
  spread,
  personaAccent,
  onPress,
}: { spread: Spread; personaAccent: string; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  function pressIn() {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  }
  function pressOut() {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  }

  const cardDots = Math.min(spread.cardCount, 10);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        style={[
          styles.spreadCard,
          spread.isPremium && styles.spreadCardPremium,
        ]}
      >
        {/* Premium overlay */}
        {spread.isPremium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumText}>✦ PRO</Text>
          </View>
        )}

        {/* Bestseller / New badges */}
        <View style={styles.badges}>
          {spread.isBestseller && (
            <View style={[styles.badge, { backgroundColor: personaAccent + '33', borderColor: personaAccent + '66' }]}>
              <Text style={[styles.badgeText, { color: personaAccent }]}>Beliebt</Text>
            </View>
          )}
          {spread.isNew && (
            <View style={[styles.badge, { backgroundColor: mc.primary + '22', borderColor: mc.primary + '55' }]}>
              <Text style={[styles.badgeText, { color: mc.primary }]}>Neu</Text>
            </View>
          )}
        </View>

        {/* Icon + title */}
        <View style={styles.spreadHeader}>
          <Text style={styles.spreadIcon}>{spread.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.spreadTitle, spread.isPremium && styles.dimText]}>
              {spread.title}
            </Text>
            <Text style={[styles.spreadSubtitle, spread.isPremium && styles.dimText]}>
              {spread.subtitle}
            </Text>
          </View>
          {spread.isPremium
            ? <Text style={styles.lockIcon}>🔒</Text>
            : <Text style={[styles.arrowIcon, { color: personaAccent }]}>→</Text>
          }
        </View>

        {/* Card dots + duration */}
        <View style={styles.spreadMeta}>
          <View style={styles.dots}>
            {Array.from({ length: cardDots }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: spread.isPremium
                      ? C.textMuted
                      : personaAccent,
                    opacity: spread.isPremium ? 0.35 : (0.4 + i * (0.6 / cardDots)),
                  },
                ]}
              />
            ))}
            {spread.cardCount > 10 && (
              <Text style={[styles.dotMore, spread.isPremium && styles.dimText]}>
                +{spread.cardCount - 10}
              </Text>
            )}
          </View>
          <Text style={[styles.duration, spread.isPremium && styles.dimText]}>
            {spread.cardCount} Karte{spread.cardCount !== 1 ? 'n' : ''} · ~{spread.durationMin} Min
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main screen ───────────────────────────────────────────────
export default function SpreadSelectScreen() {
  const { persona: personaParam, onboardingSummary } =
    useLocalSearchParams<{ persona: string; onboardingSummary: string }>();

  const persona = getPersonaById((personaParam as PersonaId) ?? 'luna');
  const [activeCategory, setActiveCategory] = useState<SpreadCategory>('daily');

  const spreads = SPREADS_BY_CATEGORY[activeCategory];

  function selectSpread(spread: Spread) {
    if (spread.isPremium) {
      // TODO: open paywall
      return;
    }
    router.push({
      pathname: '/tarot/draw' as any,
      params: {
        spreadId: spread.id,
        persona: persona.id,
        onboardingSummary: onboardingSummary ?? '',
      },
    });
  }

  return (
    <View style={styles.root}>
      {/* Ambient glow */}
      <View style={[styles.glow, { backgroundColor: persona.accentColor }]} />

      {/* Fixed header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.personaBadge}>
          <View style={[styles.avatarDot, { backgroundColor: persona.accentColor + '33' }]}>
            <Text style={[styles.avatarInitial, { color: persona.accentColor }]}>
              {persona.name.de[0]}
            </Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Legung wählen</Text>
            <Text style={styles.headerSub}>mit {persona.name.de}</Text>
          </View>
        </View>
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillRow}
        style={styles.pillScroll}
      >
        {CATEGORIES.map((cat) => (
          <CategoryPill
            key={cat}
            cat={cat}
            active={activeCategory === cat}
            onPress={() => setActiveCategory(cat)}
          />
        ))}
      </ScrollView>

      {/* Category description */}
      <Text style={styles.catDesc}>
        {CATEGORY_META[activeCategory].description}
      </Text>

      {/* Spread list */}
      <FlatList
        data={spreads}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <SpreadCard
            spread={item}
            personaAccent={persona.accentColor}
            onPress={() => selectSpread(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: mc.bg },

  glow: {
    position: 'absolute',
    top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    opacity: 0.06,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: mc.surface, borderWidth: 1, borderColor: mc.border,
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon:      { color: C.textSec, fontSize: 18 },
  personaBadge:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarDot: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 17, fontWeight: '800' },
  headerTitle:   { fontSize: 17, fontWeight: '800', color: C.white },
  headerSub:     { fontSize: 12, color: C.textSec },

  // Category pills
  pillScroll:  { flexGrow: 0 },
  pillRow: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    backgroundColor: mc.surface, borderColor: mc.border,
  },
  pillActive: {
    backgroundColor: C.gold + '18',
    borderColor: C.gold,
  },
  pillIcon:         { fontSize: 14 },
  pillLabel:        { fontSize: 13, fontWeight: '600', color: C.textSec },
  pillLabelActive:  { color: C.gold },

  catDesc: {
    fontSize: 12, color: C.textMuted,
    marginHorizontal: 16, marginBottom: 4,
  },

  // Spread list
  listContent: { padding: 16, gap: 12, paddingBottom: 48 },

  spreadCard: {
    backgroundColor: mc.surface,
    borderRadius: 18, borderWidth: 1.5, borderColor: mc.border,
    padding: 18, gap: 12,
  },
  spreadCardPremium: {
    borderColor: C.gold + '33',
    opacity: 0.75,
  },

  premiumBadge: {
    position: 'absolute', top: 12, right: 44,
    backgroundColor: C.gold + '22',
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.gold + '44',
  },
  premiumText: { color: C.gold, fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },

  badges: { flexDirection: 'row', gap: 6, position: 'absolute', top: 12, left: 18 },
  badge: {
    borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },

  spreadHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginTop: 4,
  },
  spreadIcon:     { fontSize: 28, width: 36, textAlign: 'center' },
  spreadTitle:    { fontSize: 16, fontWeight: '800', color: C.white },
  spreadSubtitle: { fontSize: 12, color: C.textSec, marginTop: 2, lineHeight: 17 },
  lockIcon:  { fontSize: 16, opacity: 0.5 },
  arrowIcon: { fontSize: 18, fontWeight: '700' },
  dimText:   { opacity: 0.45 },

  spreadMeta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  dots:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot:     { width: 6, height: 6, borderRadius: 3 },
  dotMore: { fontSize: 11, color: C.textMuted, marginLeft: 2 },
  duration:{ fontSize: 12, color: C.textMuted },
});
