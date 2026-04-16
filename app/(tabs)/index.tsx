import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  Animated, Modal, Pressable, ActivityIndicator, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '@/lib/supabase';
import { isGuestMode } from '@/lib/guest';
import { C } from '@/lib/colors';
import { MODULES, MysticModule } from '@/lib/modules';
import { CosmicBackground } from '@/components/ui/CosmicBackground';
import { useVoiceSession } from '@/hooks/useVoiceSession';

// ─── Animated glow ring ────────────────────────────────────────────────────
function GlowRing({ color }: { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.glowRing, { borderColor: color, opacity }]}
    />
  );
}

// ─── Module card ───────────────────────────────────────────────────────────
function ModuleCard({ mod, onPress }: { mod: MysticModule; onPress: () => void }) {
  const locked = mod.status === 'locked';
  const scaleAnim = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.moduleCard,
          { borderColor: locked ? C.border : mod.colors.primary + '55' },
          locked && styles.moduleCardLocked,
        ]}
        onPress={onPress}
        onPressIn={() => {
          if (!locked) Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
        }}
        onPressOut={() => {
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 30 }).start();
        }}
        activeOpacity={locked ? 0.7 : 0.9}
      >
        <View style={[styles.moduleCardBg, { backgroundColor: mod.colors.surface }]} />
        {!locked && <GlowRing color={mod.colors.primary} />}
        <View style={[styles.iconWrap, { backgroundColor: mod.colors.primary + '22' }]}>
          <Text style={[styles.icon, { color: locked ? C.textMuted : mod.colors.primary }]}>{mod.icon}</Text>
        </View>
        <View style={styles.moduleText}>
          <Text style={[styles.moduleName, { color: locked ? C.textMuted : C.white }]}>{MOD_NAMES[mod.id]}</Text>
          <Text style={[styles.moduleDesc, { color: locked ? C.textMuted + '88' : C.textSec }]}>{MOD_DESCRIPTIONS[mod.id]}</Text>
        </View>
        {locked ? (
          <View style={styles.lockBadge}><Text style={styles.lockBadgeText}>Bald</Text></View>
        ) : (
          <Text style={[styles.arrow, { color: mod.colors.primary }]}>→</Text>
        )}
        {locked && <View style={styles.lockOverlay} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Locked module modal ──────────────────────────────────────────────────
function LockedModal({ mod, visible, onClose }: { mod: MysticModule | null; visible: boolean; onClose: () => void }) {
  if (!mod) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <View style={[styles.modalBox, { borderColor: mod.colors.primary + '66' }]}>
          <Text style={[styles.modalIcon, { color: mod.colors.primary }]}>{mod.icon}</Text>
          <Text style={styles.modalTitle}>{MOD_NAMES[mod.id]}</Text>
          <Text style={styles.modalDesc}>Dieses Modul kommt bald.{'\n'}Sei dabei, wenn es sich öffnet.</Text>
          <TouchableOpacity style={[styles.modalBtn, { borderColor: mod.colors.primary }]} onPress={onClose}>
            <Text style={[styles.modalBtnText, { color: mod.colors.primary }]}>Benachrichtige mich</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.modalClose}>
            <Text style={styles.modalCloseText}>Schließen</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

// ─── Horoscope full-screen modal ──────────────────────────────────────────
function HoroscopeModal({
  visible, onClose, text, type, date,
}: {
  visible: boolean; onClose: () => void;
  text: string; type: 'daily' | 'weekly'; date: string;
}) {
  const sections = text.split(/\n?## /).filter(Boolean).map((s) => {
    const [title, ...rest] = s.split('\n');
    return { title: title.trim(), body: rest.join('\n').trim() };
  });

  const dateFormatted = (() => {
    try {
      const d = new Date(date);
      return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch { return date; }
  })();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={hStyles.root}>
        {/* Header */}
        <View style={hStyles.header}>
          <View>
            <Text style={hStyles.headerTitle}>
              {type === 'weekly' ? '📅 Wochenhoroskop' : '🌅 Tageshoroskop'}
            </Text>
            <Text style={hStyles.headerDate}>{dateFormatted}</Text>
          </View>
          <TouchableOpacity style={hStyles.closeBtn} onPress={onClose}>
            <Text style={hStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={hStyles.content}
          showsVerticalScrollIndicator={false}
        >
          {sections.length > 0 ? sections.map((sec, i) => (
            <View key={i} style={hStyles.section}>
              <View style={hStyles.sectionTitleRow}>
                <View style={hStyles.sectionDot} />
                <Text style={hStyles.sectionTitle}>{sec.title}</Text>
              </View>
              {sec.body.split(/\n\n+/).filter(Boolean).map((para, j) => (
                <Text key={j} style={hStyles.para}>{para.trim()}</Text>
              ))}
            </View>
          )) : (
            <Text style={hStyles.para}>{text}</Text>
          )}

          <TouchableOpacity
            style={hStyles.astrologyBtn}
            onPress={() => { onClose(); router.push('/astrology' as any); }}
            activeOpacity={0.85}
          >
            <Text style={hStyles.astrologyBtnText}>Vollständiges Horoskop erstellen ✧</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Daily horoscope card ─────────────────────────────────────────────────
function DailyHoroscopeCard({ userId }: { userId: string | null }) {
  const [loading, setLoading]     = useState(true);
  const [daily, setDaily]         = useState<{ text: string; date: string } | null>(null);
  const [weekly, setWeekly]       = useState<{ text: string; date: string } | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'daily' | 'weekly'>('daily');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadHoroscopes();
  }, [userId]);

  async function loadHoroscopes() {
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);

      // Check profile & daily/weekly enabled
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('birth_date, daily_horoscope_enabled, weekly_horoscope_enabled, personal_profile')
        .eq('id', userId!)
        .single();

      const hasBirth = !!profile?.birth_date;
      setHasProfile(hasBirth);

      if (!hasBirth) { setLoading(false); return; }

      // Load today's readings
      const { data: readings } = await supabase
        .from('daily_readings')
        .select('reading_type, reading_date, raw_text')
        .eq('user_id', userId!)
        .eq('reading_date', today)
        .in('reading_type', ['daily', 'weekly']);

      for (const r of readings ?? []) {
        if (r.reading_type === 'daily' && r.raw_text) {
          setDaily({ text: r.raw_text, date: r.reading_date });
        }
        if (r.reading_type === 'weekly' && r.raw_text) {
          setWeekly({ text: r.raw_text, date: r.reading_date });
        }
      }

      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    } catch { /* non-fatal */ }
    setLoading(false);
  }

  function openModal(type: 'daily' | 'weekly') {
    setModalType(type);
    setModalOpen(true);
  }

  // ── No profile yet ────────────────────────────────────────────────────
  if (!loading && !hasProfile) {
    return (
      <TouchableOpacity
        style={styles.horoscopeTeaser}
        onPress={() => router.push('/onboarding/profile-setup' as any)}
        activeOpacity={0.85}
      >
        <View style={styles.horoscopeTeaserLeft}>
          <Text style={styles.horoscopeTeaserIcon}>🌅</Text>
          <View>
            <Text style={styles.horoscopeTeaserTitle}>Tägliches Horoskop</Text>
            <Text style={styles.horoscopeTeaserSub}>Profil anlegen für tägliche Deutungen</Text>
          </View>
        </View>
        <Text style={styles.horoscopeTeaserArrow}>→</Text>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return (
      <View style={styles.horoscopeLoading}>
        <ActivityIndicator size="small" color={C.gold} />
        <Text style={styles.horoscopeLoadingText}>Horoskop wird geladen...</Text>
      </View>
    );
  }

  // ── No reading generated yet ──────────────────────────────────────────
  if (!daily && !weekly) {
    return (
      <View style={styles.horoscopePending}>
        <Text style={styles.horoscopePendingIcon}>✦</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.horoscopePendingTitle}>Tageshoroskop</Text>
          <Text style={styles.horoscopePendingSub}>Morgen früh um 07:00 Uhr bereit</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/astrology' as any)}>
          <Text style={styles.horoscopePendingLink}>Jetzt →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Horoscope cards ───────────────────────────────────────────────────
  return (
    <Animated.View style={{ opacity: fadeAnim, gap: 10 }}>
      {daily && (
        <>
          <TouchableOpacity
            style={styles.horoscopeCard}
            onPress={() => openModal('daily')}
            activeOpacity={0.88}
          >
            <View style={styles.horoscopeCardHeader}>
              <Text style={styles.horoscopeCardIcon}>🌅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.horoscopeCardTitle}>Tageshoroskop</Text>
                <Text style={styles.horoscopeCardDate}>
                  {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </Text>
              </View>
              <View style={styles.horoscopeCardBadge}>
                <Text style={styles.horoscopeCardBadgeText}>Neu</Text>
              </View>
            </View>
            <Text style={styles.horoscopeCardPreview} numberOfLines={3}>
              {daily.text.replace(/## .+\n/g, '').replace(/\n\n/g, ' ').trim()}
            </Text>
            <Text style={styles.horoscopeCardRead}>Vollständig lesen →</Text>
          </TouchableOpacity>

          <HoroscopeModal
            visible={modalOpen && modalType === 'daily'}
            onClose={() => setModalOpen(false)}
            text={daily.text}
            type="daily"
            date={daily.date}
          />
        </>
      )}

      {weekly && (
        <>
          <TouchableOpacity
            style={[styles.horoscopeCard, styles.horoscopeCardWeekly]}
            onPress={() => openModal('weekly')}
            activeOpacity={0.88}
          >
            <View style={styles.horoscopeCardHeader}>
              <Text style={styles.horoscopeCardIcon}>📅</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.horoscopeCardTitle}>Wochenhoroskop</Text>
                <Text style={styles.horoscopeCardDate}>Diese Woche</Text>
              </View>
            </View>
            <Text style={styles.horoscopeCardPreview} numberOfLines={2}>
              {weekly.text.replace(/## .+\n/g, '').replace(/\n\n/g, ' ').trim()}
            </Text>
            <Text style={styles.horoscopeCardRead}>Vollständig lesen →</Text>
          </TouchableOpacity>

          <HoroscopeModal
            visible={modalOpen && modalType === 'weekly'}
            onClose={() => setModalOpen(false)}
            text={weekly.text}
            type="weekly"
            date={weekly.date}
          />
        </>
      )}
    </Animated.View>
  );
}

// ─── Maia Companion Modal ─────────────────────────────────────────────────
function MaiaCompanionModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { status, transcript, error, connect, disconnect } = useVoiceSession('companion');
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;
    connect();
    // Cleanup only when modal closes — not on every re-render
    return () => { disconnect(); };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll transcript
  useEffect(() => {
    if (transcript.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [transcript]);

  // Pulse animation based on status
  useEffect(() => {
    const speed = status === 'speaking' ? 400 : status === 'listening' ? 900 : 1600;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: speed, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: speed, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status]);

  const statusLabel =
    status === 'connecting'  ? 'Verbinde...' :
    status === 'connected'   ? 'Mikrofon wird aktiviert...' :
    status === 'listening'   ? 'Hört zu...' :
    status === 'speaking'    ? 'Spricht...' :
    status === 'thinking'    ? 'Denkt nach...' :
    status === 'ended'       ? 'Gespräch beendet' :
    status === 'error'       ? (error ?? 'Fehler') :
    'Bereit';

  const orbColor =
    status === 'speaking'  ? C.gold :
    status === 'listening' ? '#00D4FF' :
    status === 'thinking'  ? '#FF00AA' :
    C.textMuted;

  function handleClose() {
    disconnect();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} statusBarTranslucent>
      <View style={mStyles.root}>
        {/* Header */}
        <View style={mStyles.header}>
          <View style={mStyles.headerLeft}>
            <Text style={mStyles.maiaLabel}>✦ MAIA</Text>
            <Text style={mStyles.statusLabel}>{statusLabel}</Text>
          </View>
          <TouchableOpacity style={mStyles.closeBtn} onPress={handleClose}>
            <Text style={mStyles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Orb */}
        <View style={mStyles.orbContainer}>
          <Animated.View style={[mStyles.orbOuter, { borderColor: orbColor + '44', transform: [{ scale: pulseAnim }] }]}>
            <Animated.View style={[mStyles.orbInner, { backgroundColor: orbColor + '22', borderColor: orbColor + '88' }]}>
              <Text style={[mStyles.orbIcon, { color: orbColor }]}>
                {status === 'speaking' ? '◉' : status === 'listening' ? '◎' : '○'}
              </Text>
            </Animated.View>
          </Animated.View>
          <Text style={[mStyles.orbStatusText, { color: orbColor }]}>{statusLabel}</Text>
        </View>

        {/* Transcript */}
        <ScrollView
          ref={scrollRef}
          style={mStyles.transcriptScroll}
          contentContainerStyle={mStyles.transcriptContent}
          showsVerticalScrollIndicator={false}
        >
          {transcript.length === 0 && status !== 'error' && (
            <Text style={mStyles.transcriptEmpty}>Maia hört dir zu. Sprich einfach.</Text>
          )}
          {transcript.map((entry, i) => (
            <View key={i} style={[mStyles.bubble, entry.role === 'user' ? mStyles.bubbleUser : mStyles.bubbleMaia]}>
              <Text style={[mStyles.bubbleText, entry.role === 'user' ? mStyles.bubbleTextUser : mStyles.bubbleTextMaia]}>
                {entry.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* End button */}
        <View style={mStyles.footer}>
          <TouchableOpacity style={mStyles.endBtn} onPress={handleClose} activeOpacity={0.85}>
            <Text style={mStyles.endBtnText}>Gespräch beenden</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Floating Maia orb button ──────────────────────────────────────────────
function MaiaFloatingButton({ onPress }: { onPress: () => void }) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] });

  return (
    <TouchableOpacity style={mStyles.floatingBtn} onPress={onPress} activeOpacity={0.85}>
      <Animated.View style={[mStyles.floatingGlow, { opacity: glowOpacity }]} />
      <Text style={mStyles.floatingIcon}>✦</Text>
      <Text style={mStyles.floatingLabel}>Maia</Text>
    </TouchableOpacity>
  );
}

// ─── Static maps ──────────────────────────────────────────────────────────
const MOD_NAMES: Record<string, string> = {
  tarot:      'Tarot',
  astrology:  'Astrologie',
  numerology: 'Numerologie',
  coffee:     'Kaffeesatz',
  palm:       'Palmreading',
};

const MOD_DESCRIPTIONS: Record<string, string> = {
  tarot:      'Karten legen · 3 Leserinnen · 4 Legestile',
  astrology:  'Geburtshoroskop · Planeten · Transite',
  numerology: 'Lebenszahl · Seelenzahl · Jahresenergie',
  coffee:     'Foto hochladen · KI-Deutung · Orakel',
  palm:       'Hand scannen · Linien · Lebensweg',
};

// ─── Main screen ──────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId]           = useState<string | null>(null);
  const [guest, setGuest]             = useState(false);
  const [lockedMod, setLockedMod]     = useState<MysticModule | null>(null);
  const [companionOpen, setCompanionOpen] = useState(false);

  // Reload on focus (so horoscope updates after profile setup)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  async function load() {
    const guestMode = await isGuestMode();
    setGuest(guestMode);
    if (guestMode) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/(auth)/login'); return; }
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, personal_profile')
      .eq('id', user.id)
      .single();

    // Prefer personal_profile.displayName, fallback to display_name
    const pp = profile?.personal_profile as any;
    setDisplayName(pp?.displayName ?? profile?.display_name ?? null);
  }

  function handleModulePress(mod: MysticModule) {
    if (mod.status === 'locked') {
      setLockedMod(mod);
    } else {
      router.push(mod.route as any);
    }
  }

  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? 'Gute Nacht' :
    hour < 12 ? 'Guten Morgen' :
    hour < 18 ? 'Guten Tag' :
                'Guten Abend';

  return (
    <CosmicBackground starCount={70} style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Guest banner */}
        {guest && (
          <TouchableOpacity style={styles.guestBanner} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.guestBannerText}>
              Testmodus ·{' '}
              <Text style={styles.guestBannerLink}>Jetzt Konto erstellen →</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>✦ MYSTIC</Text>
          <Text style={styles.greeting}>
            {greeting}{displayName ? `, ${displayName}` : ''}
          </Text>
          <Text style={styles.sub}>Wähle dein Orakel</Text>
        </View>

        {/* ── Daily / Weekly Horoscope Card ────────────────────────────── */}
        {!guest && userId && (
          <>
            <Text style={styles.sectionLabel}>DEIN HOROSKOP</Text>
            <DailyHoroscopeCard userId={userId} />
          </>
        )}

        {/* ── Module grid ──────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ORAKEL</Text>
        <View style={styles.moduleList}>
          {MODULES.map((mod) => (
            <ModuleCard key={mod.id} mod={mod} onPress={() => handleModulePress(mod)} />
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <LockedModal mod={lockedMod} visible={!!lockedMod} onClose={() => setLockedMod(null)} />

      {/* Floating Maia companion button — only for logged-in users */}
      {!guest && userId && (
        <MaiaFloatingButton onPress={() => setCompanionOpen(true)} />
      )}

      <MaiaCompanionModal visible={companionOpen} onClose={() => setCompanionOpen(false)} />
    </CosmicBackground>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1 },
  scroll:  { flex: 1, backgroundColor: 'transparent' },
  content: { padding: 20, gap: 16, paddingBottom: 40 },

  guestBanner: {
    backgroundColor: C.surface, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, padding: 12, alignItems: 'center',
  },
  guestBannerText: { color: C.textMuted, fontSize: 13 },
  guestBannerLink: { color: C.gold, fontWeight: '700' },

  header:   { gap: 4, paddingTop: 8, paddingBottom: 4 },
  appName:  { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 4, marginBottom: 6 },
  greeting: { fontSize: 26, fontWeight: '800', color: C.white },
  sub:      { fontSize: 14, color: C.textSec },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.8, marginBottom: -4 },

  // ── Horoscope card states ─────────────────────────────────────────────
  horoscopeTeaser: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.gold + '33',
    padding: 16, flexDirection: 'row', alignItems: 'center',
  },
  horoscopeTeaserLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  horoscopeTeaserIcon:  { fontSize: 28 },
  horoscopeTeaserTitle: { fontSize: 14, fontWeight: '700', color: C.white },
  horoscopeTeaserSub:   { fontSize: 12, color: C.textMuted, marginTop: 2 },
  horoscopeTeaserArrow: { fontSize: 18, color: C.gold, fontWeight: '700' },

  horoscopeLoading: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, padding: 14,
  },
  horoscopeLoadingText: { color: C.textMuted, fontSize: 13 },

  horoscopePending: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  horoscopePendingIcon:  { fontSize: 22, color: C.gold },
  horoscopePendingTitle: { fontSize: 14, fontWeight: '700', color: C.white },
  horoscopePendingShub: { fontSize: 12, color: C.textMuted, marginTop: 2 },
  horoscopePendingSub:  { fontSize: 12, color: C.textMuted, marginTop: 2 },
  horoscopePendingLink: { color: C.gold, fontWeight: '700', fontSize: 14 },

  horoscopeCard: {
    backgroundColor: C.surface, borderRadius: 18,
    borderWidth: 1.5, borderColor: C.gold + '44',
    padding: 18, gap: 10,
  },
  horoscopeCardWeekly: {
    borderColor: '#7B8CDE44',
  },
  horoscopeCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  horoscopeCardIcon:   { fontSize: 24 },
  horoscopeCardTitle:  { fontSize: 15, fontWeight: '800', color: C.white },
  horoscopeCardDate:   { fontSize: 12, color: C.textMuted, marginTop: 1 },
  horoscopeCardBadge: {
    backgroundColor: C.gold + '22', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: C.gold + '44',
  },
  horoscopeCardBadgeText: { color: C.gold, fontSize: 11, fontWeight: '700' },
  horoscopeCardPreview:   { fontSize: 14, color: C.textSec, lineHeight: 21 },
  horoscopeCardRead:      { fontSize: 13, color: C.gold, fontWeight: '700' },

  // ── Module grid ───────────────────────────────────────────────────────
  moduleList: { gap: 14 },
  moduleCard: {
    borderRadius: 20, borderWidth: 1.5, padding: 20,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    overflow: 'hidden', minHeight: 88,
  },
  moduleCardLocked: { opacity: 0.6 },
  moduleCardBg: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  glowRing: { ...StyleSheet.absoluteFillObject, borderRadius: 20, borderWidth: 1, margin: -1 },

  iconWrap: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  icon:      { fontSize: 26 },
  moduleText:{ flex: 1, gap: 4 },
  moduleName:{ fontSize: 17, fontWeight: '800' },
  moduleDesc:{ fontSize: 12 },
  lockBadge: { backgroundColor: '#FFFFFF18', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  lockBadgeText: { color: C.textMuted, fontSize: 11, fontWeight: '700' },
  arrow:     { fontSize: 20, fontWeight: '700' },
  lockOverlay: { ...StyleSheet.absoluteFillObject, borderRadius: 20, backgroundColor: '#00000028' },

  // ── Locked modal ──────────────────────────────────────────────────────
  modalBackdrop: { flex: 1, backgroundColor: '#000000BB', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalBox:  { backgroundColor: C.surfaceUp, borderRadius: 24, borderWidth: 1.5, padding: 32, alignItems: 'center', gap: 12, width: '100%' },
  modalIcon: { fontSize: 44 },
  modalTitle:{ fontSize: 22, fontWeight: '800', color: C.white },
  modalDesc: { fontSize: 15, color: C.textSec, textAlign: 'center', lineHeight: 22 },
  modalBtn:  { marginTop: 8, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 12 },
  modalBtnText: { fontSize: 14, fontWeight: '700' },
  modalClose:   { marginTop: 4 },
  modalCloseText: { color: C.textMuted, fontSize: 13 },
});

// ─── Horoscope modal styles ───────────────────────────────────────────────
const hStyles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: C.white },
  headerDate:  { fontSize: 13, color: C.textMuted, marginTop: 2 },
  closeBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:{ color: C.textSec, fontSize: 16, fontWeight: '700' },

  content: { padding: 22, gap: 24, paddingBottom: 60 },

  section: { gap: 12 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.gold },
  sectionTitle:{ fontSize: 16, fontWeight: '800', color: C.white },
  para:        { fontSize: 15, color: C.textSec, lineHeight: 24 },

  astrologyBtn: {
    backgroundColor: C.surface, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.gold + '55',
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  astrologyBtnText: { color: C.gold, fontSize: 14, fontWeight: '700' },
});

// ─── Maia companion styles ────────────────────────────────────────────────
const mStyles = StyleSheet.create({
  // Floating button
  floatingBtn: {
    position: 'absolute', bottom: 28, right: 20,
    alignItems: 'center', justifyContent: 'center',
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#0D0D1A',
    borderWidth: 1.5, borderColor: C.gold + '66',
    shadowColor: C.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  floatingGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    backgroundColor: C.gold + '22',
  },
  floatingIcon:  { fontSize: 22, color: C.gold },
  floatingLabel: { fontSize: 9, fontWeight: '700', color: C.gold, letterSpacing: 1, marginTop: 1 },

  // Companion modal
  root: { flex: 1, backgroundColor: '#08081A' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerLeft:  { gap: 2 },
  maiaLabel:   { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 4 },
  statusLabel: { fontSize: 13, color: C.textMuted },
  closeBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  closeBtnText:{ fontSize: 16, fontWeight: '700', color: C.textSec },

  // Orb
  orbContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
  orbOuter: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  orbInner: {
    width: 90, height: 90, borderRadius: 45,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  orbIcon:       { fontSize: 32 },
  orbStatusText: { marginTop: 16, fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },

  // Transcript
  transcriptScroll:   { flex: 1 },
  transcriptContent:  { padding: 16, gap: 10, paddingBottom: 20 },
  transcriptEmpty:    { color: C.textMuted, fontSize: 14, textAlign: 'center', marginTop: 20 },

  bubble: {
    maxWidth: '80%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end', backgroundColor: C.gold + '22',
    borderWidth: 1, borderColor: C.gold + '44',
  },
  bubbleMaia: {
    alignSelf: 'flex-start', backgroundColor: '#00D4FF11',
    borderWidth: 1, borderColor: '#00D4FF33',
  },
  bubbleText:     { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: C.white },
  bubbleTextMaia: { color: '#00D4FF' },

  // Footer
  footer: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 36 : 20 },
  endBtn: {
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    paddingVertical: 14, alignItems: 'center',
  },
  endBtnText: { color: C.textSec, fontSize: 14, fontWeight: '700' },
});
