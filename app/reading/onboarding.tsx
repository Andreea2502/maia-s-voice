/**
 * Onboarding Flow:
 * Step 1: Persona Intro (with voiceover preview)
 * Step 2: Choose input mode (Voice or Text)
 * Step 3: 3-4 minute conversation
 * Step 4: → Cards
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated as RNAnimated, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';
import { PERSONAS, getPersonaById } from '@/lib/personas';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { VoiceSession } from '@/components/voice/VoiceSession';
import { useLanguage } from '@/hooks/useLanguage';
import { useSupabase } from '@/hooks/useSupabase';
import { InputMode, VoiceSessionResult } from '@/types/voice';
import { PersonaId } from '@/types/user';

type OnboardingStep =
  | 'persona_intro'
  | 'choose_input'
  | 'voice_conversation'
  | 'text_conversation'
  | 'complete';

// Simple text-based onboarding conversation state
interface TextMessage {
  role: 'user' | 'assistant';
  text: string;
}

const TEXT_ONBOARDING_FLOW: Record<string, string[]> = {
  de: [
    'Herzlich willkommen. Ich freue mich, dass du hier bist. Wie geht es dir gerade?',
    'Das höre ich. Was beschäftigt dich in letzter Zeit am meisten?',
    'Ich verstehe. Gibt es etwas Bestimmtes, das du dir von diesem Reading erhoffst?',
    'Schön. Dann lass uns gemeinsam in die Karten schauen.',
  ],
  en: [
    'Welcome. I\'m glad you\'re here. How are you feeling right now?',
    'I hear you. What has been on your mind the most lately?',
    'I understand. Is there something specific you hope to get from this reading?',
    'Wonderful. Let us look at the cards together.',
  ],
  ar: [
    'مرحباً بك. كيف حالك الآن؟',
    'أسمعك. ما الذي يشغل تفكيرك أكثر؟',
    'هل هناك شيء محدد تأمل في الحصول عليه من هذه القراءة؟',
    'رائع. دعينا ننظر في الأوراق معاً.',
  ],
};

function getTextFlow(language: string): string[] {
  return TEXT_ONBOARDING_FLOW[language] ?? TEXT_ONBOARDING_FLOW['de']!;
}

export default function OnboardingScreen() {
  const supabase = useSupabase();
  const { language, t } = useLanguage();

  const [step, setStep] = useState<OnboardingStep>('persona_intro');
  const [selectedPersonaId, setSelectedPersonaId] = useState<PersonaId>('mystic_elena');
  const [inputMode, setInputMode] = useState<InputMode>('voice');
  const [onboardingSummary, setOnboardingSummary] = useState('');
  const [loading, setLoading] = useState(false);

  // Text conversation state
  const [textMessages, setTextMessages] = useState<TextMessage[]>([]);
  const [textInput, setTextInput] = useState('');
  const [textFlowIndex, setTextFlowIndex] = useState(0);
  const textFlow = getTextFlow(language);
  const persona = getPersonaById(selectedPersonaId);

  // Fade animation for step transitions
  const fadeAnim = useRef(new RNAnimated.Value(1)).current;

  function fadeTransition(callback: () => void) {
    RNAnimated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      callback();
      RNAnimated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }

  // Save preferred persona
  async function handlePersonaSelect(personaId: PersonaId) {
    setSelectedPersonaId(personaId);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('user_profiles').update({ preferred_persona: personaId }).eq('id', user.id);
    }
  }

  function handlePersonaConfirm() {
    fadeTransition(() => setStep('choose_input'));
  }

  function handleChooseVoice() {
    setInputMode('voice');
    fadeTransition(() => setStep('voice_conversation'));
  }

  function handleChooseText() {
    setInputMode('text');
    // Start text conversation with first message from persona
    setTextMessages([{ role: 'assistant', text: textFlow[0] ?? '' }]);
    setTextFlowIndex(1);
    fadeTransition(() => setStep('text_conversation'));
  }

  function handleTextSend() {
    if (!textInput.trim()) return;
    const userMsg = textInput.trim();
    setTextInput('');
    setTextMessages((prev) => [...prev, { role: 'user', text: userMsg }]);

    // Respond with next flow message
    setTimeout(() => {
      const nextMsg = textFlow[textFlowIndex];
      if (nextMsg) {
        setTextMessages((prev) => [...prev, { role: 'assistant', text: nextMsg }]);
        setTextFlowIndex((i) => i + 1);
        if (textFlowIndex >= textFlow.length - 1) {
          // Last message — complete after a short delay
          setTimeout(() => handleTextComplete(userMsg), 1500);
        }
      }
    }, 800);
  }

  function handleTextComplete(lastUserMessage: string) {
    const summary = textMessages
      .filter((m) => m.role === 'user')
      .map((m) => m.text)
      .join('. ');
    setOnboardingSummary(summary);
    fadeTransition(() => setStep('complete'));
  }

  async function handleVoiceComplete(result: VoiceSessionResult) {
    const summary = result.transcript
      .filter((e) => e.role === 'user')
      .map((e) => e.text)
      .join('. ');
    setOnboardingSummary(summary);
    fadeTransition(() => setStep('complete'));
  }

  async function handleProceedToCards() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_profiles').update({ onboarding_completed: true }).eq('id', user.id);
      }
      router.push({
        pathname: '/reading/choose-spread',
        params: { onboarding_summary: onboardingSummary, input_mode: inputMode },
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <RNAnimated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
        {step === 'persona_intro' && (
          <PersonaIntroStep
            selectedPersonaId={selectedPersonaId}
            onSelectPersona={handlePersonaSelect}
            onConfirm={handlePersonaConfirm}
            language={language}
            t={t}
            persona={persona}
          />
        )}

        {step === 'choose_input' && (
          <ChooseInputStep
            persona={persona}
            onChooseVoice={handleChooseVoice}
            onChooseText={handleChooseText}
            t={t}
          />
        )}

        {step === 'voice_conversation' && (
          <View style={styles.conversationContainer}>
            <VoiceSession
              persona={persona}
              onComplete={handleVoiceComplete}
              onError={(err) => console.warn('Voice error:', err)}
            />
          </View>
        )}

        {step === 'text_conversation' && (
          <TextConversationStep
            messages={textMessages}
            textInput={textInput}
            onInputChange={setTextInput}
            onSend={handleTextSend}
            persona={persona}
            t={t}
            isComplete={textFlowIndex >= textFlow.length}
          />
        )}

        {step === 'complete' && (
          <CompleteStep
            persona={persona}
            onProceed={handleProceedToCards}
            loading={loading}
            t={t}
          />
        )}
      </RNAnimated.View>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────

function PersonaIntroStep({
  selectedPersonaId, onSelectPersona, onConfirm, language, t, persona,
}: {
  selectedPersonaId: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
  onConfirm: () => void;
  language: string;
  t: (key: string) => string;
  persona: ReturnType<typeof getPersonaById>;
}) {
  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>{t('onboarding.choose_persona_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.choose_persona_subtitle')}</Text>

      <View style={styles.personaGrid}>
        {PERSONAS.map((p) => (
          <View key={p.id} style={styles.personaCardWrapper}>
            <PersonaAvatar
              persona={p}
              selected={selectedPersonaId === p.id}
              onPress={() => onSelectPersona(p.id)}
              size="large"
              showInfo
            />
            <Text style={styles.personaDescription} numberOfLines={4}>
              {p.description[language] ?? p.description['de']}
            </Text>
            {/* Intro quote */}
            <View style={[styles.introQuote, { borderLeftColor: p.accentColor }]}>
              <Text style={[styles.introQuoteText, { color: p.accentColor + 'cc' }]}>
                "{p.introText[language] ?? p.introText['de']}"
              </Text>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.confirmBtn, { backgroundColor: persona.accentColor }]}
        onPress={onConfirm}
      >
        <Text style={styles.confirmBtnText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ChooseInputStep({
  persona, onChooseVoice, onChooseText, t,
}: {
  persona: ReturnType<typeof getPersonaById>;
  onChooseVoice: () => void;
  onChooseText: () => void;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.chooseInputContainer}>
      <PersonaAvatar persona={persona} size="medium" />
      <Text style={styles.stepTitle}>{t('onboarding.choose_input_title')}</Text>
      <Text style={styles.stepSubtitle}>{t('onboarding.choose_input_subtitle')}</Text>

      <View style={styles.inputOptions}>
        <TouchableOpacity
          style={[styles.inputOption, { borderColor: persona.accentColor + '66' }]}
          onPress={onChooseVoice}
          activeOpacity={0.85}
        >
          <Text style={styles.inputOptionEmoji}>🎙️</Text>
          <Text style={[styles.inputOptionTitle, { color: persona.accentColor }]}>
            {t('onboarding.voice_option_title')}
          </Text>
          <Text style={styles.inputOptionDesc}>{t('onboarding.voice_option_desc')}</Text>
          <View style={[styles.inputOptionBtn, { backgroundColor: persona.accentColor }]}>
            <Text style={styles.inputOptionBtnText}>{t('onboarding.voice_start')}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.inputOption, { borderColor: '#ffffff22' }]}
          onPress={onChooseText}
          activeOpacity={0.85}
        >
          <Text style={styles.inputOptionEmoji}>✍️</Text>
          <Text style={[styles.inputOptionTitle, { color: '#F5E6D0' }]}>
            {t('onboarding.text_option_title')}
          </Text>
          <Text style={styles.inputOptionDesc}>{t('onboarding.text_option_desc')}</Text>
          <View style={[styles.inputOptionBtn, { backgroundColor: '#ffffff15', borderWidth: 1, borderColor: '#ffffff33' }]}>
            <Text style={[styles.inputOptionBtnText, { color: '#F5E6D0' }]}>{t('onboarding.text_start')}</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function TextConversationStep({
  messages, textInput, onInputChange, onSend, persona, t, isComplete,
}: {
  messages: TextMessage[];
  textInput: string;
  onInputChange: (v: string) => void;
  onSend: () => void;
  persona: ReturnType<typeof getPersonaById>;
  t: (key: string) => string;
  isComplete: boolean;
}) {
  return (
    <KeyboardAvoidingView
      style={styles.textConvContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Persona header */}
      <View style={[styles.personaHeader, { borderColor: persona.accentColor + '44' }]}>
        <Text style={styles.personaEmoji}>
          {persona.id === 'mystic_elena' ? '🌙' : persona.id === 'sage_amira' ? '⭐' : '🔮'}
        </Text>
        <Text style={[styles.personaHeaderName, { color: persona.accentColor }]}>
          {persona.name['de']}
        </Text>
      </View>

      {/* Messages */}
      <ScrollView style={styles.messageList} contentContainerStyle={styles.messageListContent}>
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text style={[styles.messageText, msg.role === 'assistant' && { color: persona.accentColor }]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      {!isComplete && (
        <View style={styles.inputRow}>
          <TextInput
            style={[styles.textInput, { borderColor: persona.accentColor + '44' }]}
            value={textInput}
            onChangeText={onInputChange}
            placeholder={t('onboarding.type_here')}
            placeholderTextColor="#555"
            multiline
            onSubmitEditing={onSend}
            returnKeyType="send"
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: persona.accentColor }]}
            onPress={onSend}
          >
            <Text style={styles.sendBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function CompleteStep({
  persona, onProceed, loading, t,
}: {
  persona: ReturnType<typeof getPersonaById>;
  onProceed: () => void;
  loading: boolean;
  t: (key: string) => string;
}) {
  return (
    <View style={styles.completeContainer}>
      <PersonaAvatar persona={persona} size="large" />
      <Text style={styles.completeTitle}>{t('onboarding.conversation_complete')}</Text>
      <Text style={styles.completeSubtitle}>{t('onboarding.conversation_complete_desc')}</Text>
      <TouchableOpacity
        style={[styles.proceedBtn, { backgroundColor: persona.accentColor }]}
        onPress={onProceed}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#1a0a2e" />
        ) : (
          <Text style={styles.proceedBtnText}>{t('onboarding.proceed_to_cards')}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0A1E',
  },
  stepContainer: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    gap: 20,
    paddingBottom: 60,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5E6D0',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  personaGrid: {
    gap: 24,
    marginTop: 8,
  },
  personaCardWrapper: {
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff08',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  personaDescription: {
    color: '#aaa',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  introQuote: {
    borderLeftWidth: 3,
    paddingLeft: 12,
    alignSelf: 'stretch',
  },
  introQuoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  confirmBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#1a0a2e',
    fontSize: 16,
    fontWeight: '700',
  },
  chooseInputContainer: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  inputOptions: {
    width: '100%',
    gap: 14,
    marginTop: 8,
  },
  inputOption: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 20,
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#ffffff06',
  },
  inputOptionEmoji: {
    fontSize: 32,
  },
  inputOptionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  inputOptionDesc: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputOptionBtn: {
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    marginTop: 4,
  },
  inputOptionBtnText: {
    color: '#1a0a2e',
    fontWeight: '700',
    fontSize: 14,
  },
  conversationContainer: {
    flex: 1,
    paddingTop: 24,
  },
  textConvContainer: {
    flex: 1,
    gap: 0,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#ffffff06',
  },
  personaEmoji: {
    fontSize: 20,
  },
  personaHeaderName: {
    fontSize: 16,
    fontWeight: '600',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#ffffff15',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
  },
  messageText: {
    color: '#F5E6D0',
    fontSize: 15,
    lineHeight: 22,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingBottom: 32,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#F5E6D0',
    fontSize: 15,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnText: {
    color: '#1a0a2e',
    fontSize: 20,
    fontWeight: '700',
  },
  completeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  completeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F5E6D0',
    textAlign: 'center',
  },
  completeSubtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    lineHeight: 20,
  },
  proceedBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginTop: 12,
  },
  proceedBtnText: {
    color: '#1a0a2e',
    fontSize: 16,
    fontWeight: '700',
  },
});
