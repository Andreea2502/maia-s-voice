import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, Animated,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { C } from '@/lib/colors';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { useSupabase } from '@/hooks/useSupabase';
import { CosmicBackground } from '@/components/ui/CosmicBackground';
import { GlowOrb } from '@/components/ui/GlowOrb';

type Mode = 'voice' | 'text';
type Message = { role: 'user' | 'assistant'; text: string };

// ─── Voice Mode ───────────────────────────────────────────────────────────────
function VoiceOnboarding({ onDone }: { onDone: () => void }) {
  const { status, transcript, error, connect, disconnect } = useVoiceSession();
  const scrollRef = useRef<ScrollView>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    connect();
    return () => { disconnect(); };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [transcript]);

  // Pulse animation when speaking or listening
  useEffect(() => {
    if (status === 'speaking' || status === 'listening') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [status]);

  const statusLabel: Record<string, string> = {
    idle:        'Verbinde...',
    connecting:  'Verbinde...',
    connected:   'Verbunden',
    listening:   'Ich höre zu...',
    thinking:    'Ich denke...',
    speaking:    'Ich spreche...',
    ended:       'Gespräch beendet',
    error:       'Verbindungsfehler',
  };

  const statusColor: Record<string, string> = {
    listening: C.gold,
    speaking:  '#00D4FF',
    thinking:  C.purple,
    error:     C.error,
  };

  return (
    <View style={styles.voiceContainer}>

      {/* Pulsing orb */}
      <View style={styles.orbWrap}>
        <GlowOrb state={status as any} icon="✦" size={130} />
        <Text style={[styles.statusLabel, { color: statusColor[status] ?? C.textSec }]}>
          {statusLabel[status] ?? status}
        </Text>
      </View>

      {/* Transcript */}
      {transcript.length > 0 && (
        <ScrollView
          ref={scrollRef}
          style={styles.transcript}
          contentContainerStyle={styles.transcriptContent}
          showsVerticalScrollIndicator={false}
        >
          {transcript.map((entry, i) => (
            <View
              key={i}
              style={[
                styles.bubble,
                entry.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
              ]}
            >
              <Text style={[
                styles.bubbleText,
                entry.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
              ]}>
                {entry.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <TouchableOpacity onPress={connect} style={styles.retryBtn}>
            <Text style={styles.retryText}>Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Done button — shown after some exchanges */}
      {transcript.length >= 6 && (
        <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
          <Text style={styles.doneBtnText}>Zum Orakel →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Text Mode ────────────────────────────────────────────────────────────────
function TextOnboarding({ onDone }: { onDone: () => void }) {
  const supabase = useSupabase();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: 'Herzlich willkommen bei MYSTIC. Ich freue mich, dass du hier bist.\n\nWie geht es dir heute — wirklich?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('onboarding-chat', {
        body: { message: text, history },
      });
      if (error) throw error;

      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
      setHistory(data.history);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Entschuldige, da ist etwas schiefgelaufen. Versuche es nochmal.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
            ]}
          >
            <Text style={[
              styles.bubbleText,
              msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextAssistant,
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={styles.bubbleAssistant}>
            <ActivityIndicator size="small" color={C.gold} />
          </View>
        )}
      </ScrollView>

      {/* Done button — shown after some exchanges */}
      {messages.length >= 7 && (
        <TouchableOpacity style={styles.doneBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>Zum Orakel →</Text>
        </TouchableOpacity>
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Schreibe hier..."
          placeholderTextColor={C.textMuted}
          multiline
          maxLength={500}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
          onPress={send}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendBtnText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('input_mode').then((m) => {
      setMode((m as Mode) ?? 'text');
    });
  }, []);

  function handleDone() {
    router.replace('/onboarding/profile-setup' as any);
  }

  if (!mode) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.gold} />
      </View>
    );
  }

  return (
    <CosmicBackground starCount={50} style={styles.safe}>
    <SafeAreaView style={styles.safeInner}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>✦ MYSTIC</Text>
        <Text style={styles.headerSub}>Erstes Gespräch</Text>
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleDone}
        >
          <Text style={styles.skipText}>Überspringen</Text>
        </TouchableOpacity>
      </View>

      {mode === 'voice'
        ? <VoiceOnboarding onDone={handleDone} />
        : <TextOnboarding onDone={handleDone} />
      }
    </SafeAreaView>
    </CosmicBackground>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe:      { flex: 1 },
  safeInner: { flex: 1, backgroundColor: 'transparent' },
  loading:   { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 13, fontWeight: '800', color: C.gold, letterSpacing: 3, flex: 1 },
  headerSub:   { fontSize: 13, color: C.textSec, flex: 1, textAlign: 'center' },
  skipBtn:     { flex: 1, alignItems: 'flex-end' },
  skipText:    { fontSize: 13, color: C.textMuted },

  // Voice
  voiceContainer: { flex: 1, padding: 24, gap: 20 },
  orbWrap:  { alignItems: 'center', gap: 16, paddingTop: 20 },
  orbOuter: {
    width: 130, height: 130, borderRadius: 65,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  orbInner: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  orbIcon:     { fontSize: 36, color: C.gold },
  statusLabel: { fontSize: 14, fontWeight: '600' },

  transcript:        { flex: 1 },
  transcriptContent: { gap: 10, paddingBottom: 16 },

  // Chat
  chatScroll:  { flex: 1 },
  chatContent: { padding: 20, gap: 12, paddingBottom: 8 },

  // Shared bubbles
  bubble: {
    maxWidth: '82%', borderRadius: 16, padding: 14,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: C.gold + '22',
    borderWidth: 1, borderColor: C.gold + '44',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText:          { fontSize: 15, lineHeight: 22 },
  bubbleTextUser:      { color: C.white },
  bubbleTextAssistant: { color: C.textSec },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    padding: 14, gap: 10,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  input: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    color: C.white, fontSize: 15, paddingHorizontal: 14, paddingVertical: 12,
    maxHeight: 120,
  },
  sendBtn:    { width: 44, height: 44, borderRadius: 14, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.3 },
  sendBtnText:{ color: C.bg, fontSize: 20, fontWeight: '800' },

  // Done
  doneBtn: {
    margin: 20, marginTop: 0,
    backgroundColor: C.surfaceUp,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.gold + '66',
    paddingVertical: 16, alignItems: 'center',
  },
  doneBtnText: { color: C.gold, fontSize: 15, fontWeight: '700' },

  // Error
  errorBox: {
    backgroundColor: C.errorBg, borderRadius: 12,
    borderWidth: 1, borderColor: C.errorBorder,
    padding: 14, gap: 8,
  },
  errorText:  { color: C.error, fontSize: 13 },
  retryBtn:   { alignSelf: 'flex-start' },
  retryText:  { color: C.gold, fontSize: 13, fontWeight: '700' },
});
