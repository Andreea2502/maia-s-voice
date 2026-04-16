/**
 * Tarot Pre-Reading Onboarding
 * User first chooses: speak (voice) or write (text).
 * Voice: ElevenLabs ConvAI session with the chosen persona.
 * Text: text chat with emotion-bracket stripping.
 * Route: /tarot/onboarding?persona=luna|zara|maya&profileSummary=ENCODED
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { C, MODULE_COLORS } from '@/lib/colors';
import { getPersonaById, PersonaId } from '@/lib/personas';
import { useVoiceSession } from '@/hooks/useVoiceSession';

const mc = MODULE_COLORS.tarot;

type Mode = 'choosing' | 'voice' | 'text';
interface Message { role: 'user' | 'assistant'; content: string; }

// Strip emotion brackets like [excited], [thoughtful], [whispering] from AI text
function clean(text: string): string {
  return text.replace(/\[[^\]]*\]/g, '').replace(/  +/g, ' ').trim();
}

const QUICK_TOPICS = [
  { icon: '💕', label: 'Liebe & Beziehung' },
  { icon: '💼', label: 'Beruf & Erfolg' },
  { icon: '🌱', label: 'Persönlichkeit & Wachstum' },
  { icon: '🧭', label: 'Eine Entscheidung treffen' },
  { icon: '💸', label: 'Geld & Finanzen' },
  { icon: '🔮', label: 'Was kommt als Nächstes?' },
];

// ─── Mode-selection screen ────────────────────────────────────────────────────
function ChoosingScreen({
  personaName,
  accentColor,
  onVoice,
  onText,
}: {
  personaName: string;
  accentColor: string;
  onVoice: () => void;
  onText: () => void;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  return (
    <SafeAreaView style={[cStyles.safe, { backgroundColor: mc.bg }]}>
      <Animated.View style={[cStyles.root, { opacity: fadeAnim }]}>
        <View style={[cStyles.iconWrap, { backgroundColor: accentColor + '22' }]}>
          <Text style={[cStyles.iconText, { color: accentColor }]}>
            {personaName[0]}
          </Text>
        </View>
        <Text style={cStyles.title}>{personaName}</Text>
        <Text style={cStyles.sub}>Wie möchtest du mit mir sprechen?</Text>

        <TouchableOpacity
          style={[cStyles.btn, cStyles.btnVoice, { borderColor: accentColor, backgroundColor: accentColor + '18' }]}
          onPress={onVoice}
          activeOpacity={0.85}
        >
          <Text style={cStyles.btnIcon}>🎙</Text>
          <View style={cStyles.btnTexts}>
            <Text style={[cStyles.btnTitle, { color: accentColor }]}>Mit Stimme sprechen</Text>
            <Text style={cStyles.btnDesc}>Meine Stimme hören · Mikrofon nötig</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[cStyles.btn, cStyles.btnText, { borderColor: C.border }]}
          onPress={onText}
          activeOpacity={0.85}
        >
          <Text style={cStyles.btnIcon}>⌨️</Text>
          <View style={cStyles.btnTexts}>
            <Text style={[cStyles.btnTitle, { color: C.white }]}>Schreiben</Text>
            <Text style={cStyles.btnDesc}>Chat · kein Mikrofon nötig</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const cStyles = StyleSheet.create({
  safe:     { flex: 1 },
  root:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20 },
  iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  iconText: { fontSize: 36, fontWeight: '800' },
  title:    { fontSize: 28, fontWeight: '800', color: C.white, textAlign: 'center' },
  sub:      { fontSize: 15, color: C.textSec, textAlign: 'center', marginBottom: 8 },
  btn: {
    width: '100%', borderRadius: 20, borderWidth: 1.5,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  btnVoice: {},
  btnText:  { backgroundColor: '#FFFFFF08' },
  btnIcon:  { fontSize: 26 },
  btnTexts: { flex: 1, gap: 3 },
  btnTitle: { fontSize: 17, fontWeight: '800' },
  btnDesc:  { fontSize: 12, color: C.textMuted },
});

// ─── Voice mode ───────────────────────────────────────────────────────────────
function VoiceMode({
  personaId,
  personaName,
  accentColor,
  onFinish,
  onSwitchToText,
}: {
  personaId: PersonaId;
  personaName: string;
  accentColor: string;
  onFinish: (summary: string) => void;
  onSwitchToText: () => void;
}) {
  const { status, transcript, error, connect, disconnect } = useVoiceSession('tarot', personaId);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (transcript.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [transcript]);

  const userTurns = transcript.filter((t) => t.role === 'user').length;
  const canFinish = userTurns >= 1;

  function handleFinish() {
    const summary = transcript
      .filter((t) => t.role === 'user')
      .map((t) => t.text)
      .join(' | ');
    disconnect();
    onFinish(summary || 'Gespräch via Stimme');
  }

  const orbColor = status === 'speaking' ? accentColor : status === 'listening' ? '#00D4FF' : C.textMuted;

  const statusLabel =
    status === 'connecting'  ? 'Verbinde...' :
    status === 'connected'   ? 'Mikrofon wird aktiviert...' :
    status === 'listening'   ? 'Hört zu...' :
    status === 'speaking'    ? 'Spricht...' :
    status === 'thinking'    ? 'Denkt nach...' :
    status === 'ended'       ? 'Verbindung beendet' :
    status === 'error'       ? (error ?? 'Fehler') :
    'Verbinde...';

  return (
    <SafeAreaView style={[vStyles.safe, { backgroundColor: mc.bg }]}>
      {/* Header */}
      <View style={[vStyles.header, { borderBottomColor: accentColor + '33' }]}>
        <View style={[vStyles.avatar, { backgroundColor: accentColor + '22' }]}>
          <Text style={[vStyles.avatarText, { color: accentColor }]}>{personaName[0]}</Text>
        </View>
        <View>
          <Text style={vStyles.personaName}>{personaName}</Text>
          <Text style={vStyles.statusLabel}>{statusLabel}</Text>
        </View>
      </View>

      {/* Orb */}
      <View style={vStyles.orbWrap}>
        <Animated.View style={[vStyles.orbOuter, { borderColor: orbColor + '44', transform: [{ scale: pulseAnim }] }]}>
          <View style={[vStyles.orbInner, { backgroundColor: orbColor + '22', borderColor: orbColor + '88' }]}>
            <Text style={[vStyles.orbIcon, { color: orbColor }]}>
              {status === 'speaking' ? '◉' : status === 'listening' ? '◎' : '○'}
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Transcript */}
      <ScrollView
        ref={scrollRef}
        style={vStyles.scroll}
        contentContainerStyle={vStyles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {transcript.length === 0 && status !== 'error' && (
          <Text style={vStyles.empty}>Sprich einfach — ich höre dir zu.</Text>
        )}
        {transcript.map((t, i) => (
          <View key={i} style={[vStyles.bubble, t.role === 'user' ? vStyles.bubbleUser : vStyles.bubbleMaia]}>
            <Text style={[vStyles.bubbleText, t.role === 'user' ? vStyles.bubbleTextUser : { color: accentColor }]}>
              {clean(t.text)}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={vStyles.footer}>
        {canFinish && (
          <TouchableOpacity
            style={[vStyles.finishBtn, { backgroundColor: accentColor }]}
            onPress={handleFinish}
            activeOpacity={0.85}
          >
            <Text style={vStyles.finishBtnText}>Zu den Karten →</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={vStyles.switchBtn} onPress={() => { disconnect(); onSwitchToText(); }}>
          <Text style={vStyles.switchText}>⌨️  Lieber schreiben</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const vStyles = StyleSheet.create({
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1,
  },
  avatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText:   { fontSize: 18, fontWeight: '800' },
  personaName:  { fontSize: 15, fontWeight: '800', color: C.white },
  statusLabel:  { fontSize: 12, color: C.textMuted },
  orbWrap: { alignItems: 'center', paddingVertical: 24 },
  orbOuter: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  orbInner: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
  },
  orbIcon: { fontSize: 28 },
  scroll:        { flex: 1 },
  scrollContent: { padding: 16, gap: 10, paddingBottom: 16 },
  empty: { color: C.textMuted, fontSize: 14, textAlign: 'center', marginTop: 16 },
  bubble: {
    maxWidth: '80%', borderRadius: 16,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: C.gold + '22',
    borderWidth: 1, borderColor: C.gold + '44',
  },
  bubbleMaia: {
    alignSelf: 'flex-start',
    backgroundColor: mc.surface,
    borderWidth: 1, borderColor: mc.border,
  },
  bubbleText:     { fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: C.white },
  footer: { padding: 16, gap: 10 },
  finishBtn: {
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  finishBtnText: { color: '#060E1E', fontSize: 15, fontWeight: '800' },
  switchBtn: { alignItems: 'center', paddingVertical: 6 },
  switchText: { color: C.textMuted, fontSize: 13 },
});

// ─── Text mode ────────────────────────────────────────────────────────────────
function TextMode({
  persona,
  profileSummary,
  onFinish,
  onSwitchToVoice,
}: {
  persona: ReturnType<typeof getPersonaById>;
  profileSummary?: string;
  onFinish: (summary: string) => void;
  onSwitchToVoice: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [ready, setReady]       = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const intro = clean(
      (persona.introText as any)['de'] ??
      (persona.introText as any)['en'] ??
      'Willkommen. Wie geht es dir heute?'
    );
    setMessages([{ role: 'assistant', content: intro }]);
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const history = newMessages.slice(0, -1).map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke('onboarding-chat', {
        body: {
          message: text,
          history,
          personaId: persona.id,
          context: 'tarot_pre_reading',
          ...(profileSummary ? { profileSummary } : {}),
        },
      });

      if (error) throw error;
      if (data?.crisis) {
        setMessages((prev) => [...prev, { role: 'assistant', content: clean(data.reply) }]);
        setReady(false);
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: clean(data.reply) }]);

      const userCount = newMessages.filter((m) => m.role === 'user').length;
      const threshold = profileSummary ? 1 : 2;
      if (userCount >= threshold) setReady(true);

    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Entschuldige — ich konnte deine Nachricht gerade nicht empfangen.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function goToCards(customSummary?: string) {
    const summary = customSummary ?? messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' | ');
    onFinish(summary);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: mc.bg }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>

          {/* Header */}
          <View style={[styles.header, { backgroundColor: persona.accentColor + '22' }]}>
            <View style={[styles.avatar, { backgroundColor: persona.accentColor + '33' }]}>
              <Text style={[styles.avatarInitial, { color: persona.accentColor }]}>
                {persona.name.de[0]}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.personaName}>{persona.name.de}</Text>
              <Text style={styles.personaTagline}>{(persona.tagline as any).de}</Text>
            </View>
            {/* Switch to voice */}
            <TouchableOpacity style={styles.voiceSwitch} onPress={onSwitchToVoice}>
              <Text style={[styles.voiceSwitchText, { color: persona.accentColor }]}>🎙 Stimme</Text>
            </TouchableOpacity>
          </View>

          {/* Chat */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m, i) => (
              <View
                key={i}
                style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant]}
              >
                <Text style={[
                  styles.bubbleText,
                  m.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
                ]}>
                  {m.content}
                </Text>
              </View>
            ))}
            {loading && (
              <View style={[styles.bubble, styles.bubbleAssistant]}>
                <ActivityIndicator size="small" color={persona.accentColor} />
              </View>
            )}
          </ScrollView>

          {/* Quick topics — only before first user message */}
          {messages.filter((m) => m.role === 'user').length === 0 && !loading && (
            <View style={styles.quickWrap}>
              <Text style={styles.quickLabel}>Oder wähle ein Thema:</Text>
              <View style={styles.quickChips}>
                {QUICK_TOPICS.map((t) => (
                  <TouchableOpacity
                    key={t.label}
                    style={[styles.quickChip, { borderColor: persona.accentColor + '55' }]}
                    onPress={() => goToCards(t.label)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.quickChipIcon}>{t.icon}</Text>
                    <Text style={[styles.quickChipText, { color: persona.accentColor }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Continue to cards */}
          {ready && (
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: persona.accentColor }]}
              onPress={() => goToCards()}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Zu den Karten →</Text>
            </TouchableOpacity>
          )}
          {!ready && messages.filter((m) => m.role === 'user').length > 0 && (
            <TouchableOpacity style={styles.skipBtn} onPress={() => goToCards()}>
              <Text style={styles.skipText}>Gespräch überspringen →</Text>
            </TouchableOpacity>
          )}

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Antworte hier..."
              placeholderTextColor={C.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              returnKeyType="send"
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: persona.accentColor }, (!input.trim() || loading) && styles.sendBtnOff]}
              onPress={send}
              disabled={!input.trim() || loading}
              activeOpacity={0.8}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TarotOnboardingScreen() {
  const { persona: personaParam, profileSummary: profileSummaryEncoded } =
    useLocalSearchParams<{ persona: string; profileSummary?: string }>();

  const persona = getPersonaById((personaParam as PersonaId) ?? 'luna');
  const profileSummary = profileSummaryEncoded
    ? decodeURIComponent(profileSummaryEncoded)
    : undefined;

  const [mode, setMode] = useState<Mode>('choosing');

  function goToCards(summary: string) {
    router.push({
      pathname: '/tarot/spread-select' as any,
      params: {
        persona: persona.id,
        onboardingSummary: summary,
        ...(profileSummary ? { profileSummary: encodeURIComponent(profileSummary) } : {}),
      },
    });
  }

  if (mode === 'choosing') {
    return (
      <ChoosingScreen
        personaName={persona.name.de}
        accentColor={persona.accentColor}
        onVoice={() => setMode('voice')}
        onText={() => setMode('text')}
      />
    );
  }

  if (mode === 'voice') {
    return (
      <VoiceMode
        personaId={persona.id}
        personaName={persona.name.de}
        accentColor={persona.accentColor}
        onFinish={goToCards}
        onSwitchToText={() => setMode('text')}
      />
    );
  }

  return (
    <TextMode
      persona={persona}
      profileSummary={profileSummary}
      onFinish={goToCards}
      onSwitchToVoice={() => setMode('voice')}
    />
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: mc.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial:  { fontSize: 20, fontWeight: '800' },
  personaName:    { fontSize: 16, fontWeight: '800', color: C.white },
  personaTagline: { fontSize: 12, color: C.textSec },
  voiceSwitch: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1, borderColor: '#FFFFFF22',
  },
  voiceSwitchText: { fontSize: 12, fontWeight: '700' },

  chatScroll:  { flex: 1 },
  chatContent: { padding: 16, gap: 12, paddingBottom: 8 },

  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 18, minHeight: 42,
    justifyContent: 'center',
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: mc.surface,
    borderWidth: 1, borderColor: mc.border,
    borderBottomLeftRadius: 4,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: C.gold + '22',
    borderWidth: 1, borderColor: C.gold + '55',
    borderBottomRightRadius: 4,
  },
  bubbleText:          { fontSize: 15, lineHeight: 22 },
  bubbleTextAssistant: { color: C.textSec },
  bubbleTextUser:      { color: C.white },

  continueBtn: {
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  continueBtnText: { color: '#060E1E', fontSize: 16, fontWeight: '800' },
  skipBtn:  { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: C.textMuted, fontSize: 13 },

  quickWrap:  { paddingHorizontal: 14, paddingBottom: 4, gap: 10 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.5 },
  quickChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: mc.surface, borderRadius: 20, borderWidth: 1.5,
  },
  quickChipIcon: { fontSize: 14 },
  quickChipText: { fontSize: 13, fontWeight: '700' },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: mc.border,
  },
  input: {
    flex: 1,
    backgroundColor: mc.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: mc.border,
    paddingHorizontal: 16, paddingVertical: 12,
    color: C.white, fontSize: 15, maxHeight: 100,
  },
  sendBtn:    { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.35 },
  sendIcon:   { color: '#060E1E', fontSize: 18, fontWeight: '800' },
});
