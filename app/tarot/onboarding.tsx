/**
 * Tarot Pre-Reading Onboarding
 * Short conversation with the chosen persona before card drawing.
 * Route: /tarot/onboarding?persona=luna|zara|maya&profileSummary=ENCODED
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, Animated,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { C, MODULE_COLORS } from '@/lib/colors';
import { getPersonaById, PersonaId } from '@/lib/personas';

const mc = MODULE_COLORS.tarot;

interface Message { role: 'user' | 'assistant'; content: string; }

export default function TarotOnboardingScreen() {
  const { persona: personaParam, profileSummary: profileSummaryEncoded } =
    useLocalSearchParams<{ persona: string; profileSummary?: string }>();

  const persona = getPersonaById((personaParam as PersonaId) ?? 'luna');
  const profileSummary = profileSummaryEncoded
    ? decodeURIComponent(profileSummaryEncoded)
    : undefined;

  const [messages, setMessages]   = useState<Message[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [ready, setReady]         = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  // Send the persona's intro message on mount
  useEffect(() => {
    const intro = (persona.introText as any)['de']
      ?? (persona.introText as any)['en']
      ?? 'Willkommen. Wie geht es dir heute?';

    setMessages([{ role: 'assistant', content: intro }]);

    Animated.timing(fadeAnim, {
      toValue: 1, duration: 800, useNativeDriver: true,
    }).start();
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

      // Crisis check — if crisis flag returned, end session
      if (data?.crisis) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
        setReady(false);
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);

      // With profile: show "Zu den Karten" after just 1 user exchange
      // Without profile: require 2 exchanges
      const userCount = newMessages.filter((m) => m.role === 'user').length;
      const threshold = profileSummary ? 1 : 2;
      if (userCount >= threshold) setReady(true);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Entschuldige — ich konnte deine Nachricht gerade nicht empfangen. Versuch es nochmal.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function goToCards() {
    const summary = messages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
      .join(' | ');

    router.push({
      pathname: '/tarot/spread-select' as any,
      params: {
        persona: persona.id,
        onboardingSummary: summary,
        ...(profileSummary ? { profileSummary: encodeURIComponent(profileSummary) } : {}),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <Animated.View style={[styles.root, { opacity: fadeAnim }]}>

          {/* Persona header */}
          <View style={[styles.header, { backgroundColor: persona.accentColor + '22' }]}>
            <View style={[styles.avatar, { backgroundColor: persona.accentColor + '33' }]}>
              <Text style={[styles.avatarInitial, { color: persona.accentColor }]}>
                {persona.name.de[0]}
              </Text>
            </View>
            <View>
              <Text style={styles.personaName}>{persona.name.de}</Text>
              <Text style={styles.personaTagline}>{(persona.tagline as any).de}</Text>
            </View>
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
                style={[
                  styles.bubble,
                  m.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant,
                ]}
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

          {/* "Weiter zu den Karten" — appears after enough exchanges */}
          {ready && (
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: persona.accentColor }]}
              onPress={goToCards}
              activeOpacity={0.85}
            >
              <Text style={styles.continueBtnText}>Zu den Karten →</Text>
            </TouchableOpacity>
          )}

          {/* Skip */}
          {!ready && messages.length > 0 && (
            <TouchableOpacity style={styles.skipBtn} onPress={goToCards}>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: mc.bg },
  root: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: mc.border,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: 20, fontWeight: '800' },
  personaName:   { fontSize: 16, fontWeight: '800', color: C.white },
  personaTagline:{ fontSize: 12, color: C.textSec },

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
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: C.gold, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  continueBtnText: { color: '#060E1E', fontSize: 16, fontWeight: '800' },

  skipBtn:  { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: C.textMuted, fontSize: 13 },

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
  sendBtn: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { opacity: 0.35 },
  sendIcon:   { color: '#060E1E', fontSize: 18, fontWeight: '800' },
});
