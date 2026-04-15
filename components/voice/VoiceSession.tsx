import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { VoiceIndicator } from './VoiceIndicator';
import { TranscriptDisplay } from './TranscriptDisplay';
import { VoiceSessionResult } from '@/types/voice';
import { useLanguage } from '@/hooks/useLanguage';
import { Persona } from '@/lib/personas';

interface VoiceSessionProps {
  persona: Persona;
  onComplete: (result: VoiceSessionResult) => void;
  onError?: (error: string) => void;
  autoStart?: boolean;
}

export function VoiceSession({ persona, onComplete, onError, autoStart = true }: VoiceSessionProps) {
  const { t } = useLanguage();
  const { status, transcript, error, connect, disconnect, getResult } = useVoiceSession();

  useEffect(() => {
    if (autoStart) connect();
    return () => { disconnect(); };
  }, []);

  useEffect(() => {
    if (error) onError?.(error);
  }, [error]);

  const handleEnd = () => {
    disconnect();
    onComplete(getResult());
  };

  return (
    <View style={styles.container}>
      {/* Persona indicator */}
      <View style={[styles.personaHeader, { borderColor: persona.accentColor + '44' }]}>
        <Text style={[styles.personaEmoji]}>
          {persona.id === 'luna' ? '🌙' : persona.id === 'maya' ? '⭐' : '🔮'}
        </Text>
        <Text style={[styles.personaName, { color: persona.accentColor }]}>
          {persona.name['de']}
        </Text>
      </View>

      {/* Voice status */}
      <VoiceIndicator status={status} personaColor={persona.accentColor} />

      {/* Transcript */}
      <TranscriptDisplay entries={transcript} personaColor={persona.accentColor} />

      {/* End button */}
      {(status === 'listening' || status === 'speaking' || status === 'connected') && (
        <TouchableOpacity style={[styles.endBtn, { borderColor: persona.accentColor }]} onPress={handleEnd}>
          <Text style={[styles.endBtnText, { color: persona.accentColor }]}>
            {t('onboarding.end_conversation')}
          </Text>
        </TouchableOpacity>
      )}

      {status === 'ended' && (
        <TouchableOpacity style={[styles.proceedBtn, { backgroundColor: persona.accentColor }]} onPress={handleEnd}>
          <Text style={styles.proceedBtnText}>{t('onboarding.proceed_to_cards')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
    paddingHorizontal: 24,
  },
  personaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff08',
  },
  personaEmoji: {
    fontSize: 20,
  },
  personaName: {
    fontSize: 16,
    fontWeight: '600',
  },
  endBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  endBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  proceedBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  proceedBtnText: {
    color: '#1a0a2e',
    fontSize: 16,
    fontWeight: '700',
  },
});
