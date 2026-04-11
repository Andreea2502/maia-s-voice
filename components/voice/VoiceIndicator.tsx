import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VoiceSessionStatus } from '@/types/voice';
import { VoiceWaveform } from '../ui/VoiceWaveform';
import { useLanguage } from '@/hooks/useLanguage';

interface VoiceIndicatorProps {
  status: VoiceSessionStatus;
  personaColor?: string;
}

export function VoiceIndicator({ status, personaColor = '#C9956A' }: VoiceIndicatorProps) {
  const { t } = useLanguage();

  const statusLabels: Partial<Record<VoiceSessionStatus, string>> = {
    connecting: t('common.loading'),
    connected: '...',
    listening: t('onboarding.listening'),
    processing: t('onboarding.thinking'),
    thinking: t('onboarding.thinking'),
    speaking: t('onboarding.speaking'),
    ended: '—',
    error: t('common.error'),
  };

  const label = statusLabels[status] ?? '';
  const isActive = status === 'listening' || status === 'speaking';

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: personaColor, opacity: isActive ? 1 : 0.3 }]} />
      <VoiceWaveform active={isActive} color={personaColor} />
      <Text style={[styles.label, { color: personaColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
