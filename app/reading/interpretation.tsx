import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';

export default function InterpretationScreen() {
  const supabase = useSupabase();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{
    spread_type: string; question: string;
    onboarding_summary: string; input_mode: string;
    reading_type: string; cards_json: string;
  }>();

  const [interpretation, setInterpretation] = useState('');
  const [readingId, setReadingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    generateInterpretation();
  }, []);

  async function generateInterpretation() {
    try {
      const cards = JSON.parse(params.cards_json ?? '[]');

      // Start reading
      const { data: startData, error: startError } = await supabase.functions.invoke('reading-start', {
        body: {
          spread_type: params.spread_type ?? 'three_card',
          question: params.question,
          reading_type: params.reading_type ?? 'virtual',
          input_mode: params.input_mode ?? 'voice',
        },
      });
      if (startError) throw startError;
      setReadingId(startData.reading_id);

      // Get interpretation
      const { data: interpData, error: interpError } = await supabase.functions.invoke('reading-interpret', {
        body: {
          reading_id: startData.reading_id,
          cards,
          onboarding_summary: params.onboarding_summary ?? '',
          question: params.question ?? '',
          voice_used: params.input_mode === 'voice',
        },
      });
      if (interpError) throw interpError;
      setInterpretation(interpData.interpretation);
    } catch (err: any) {
      setError(err.message ?? t('errors.network'));
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C9956A" />
        <Text style={styles.loadingText}>{t('reading.generating')}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={generateInterpretation}>
          <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('reading.interpretation_title')}</Text>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.interpretationText}>{interpretation}</Text>
      </ScrollView>
      <TouchableOpacity
        style={styles.feedbackBtn}
        onPress={() => router.push({ pathname: '/reading/feedback', params: { reading_id: readingId } })}
      >
        <Text style={styles.feedbackBtnText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E', padding: 24, gap: 16 },
  loadingContainer: { flex: 1, backgroundColor: '#0D0A1E', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#888', fontSize: 14, textAlign: 'center', maxWidth: 220 },
  errorContainer: { flex: 1, backgroundColor: '#0D0A1E', alignItems: 'center', justifyContent: 'center', gap: 16 },
  errorText: { color: '#ff6b6b', textAlign: 'center' },
  retryBtn: { backgroundColor: '#C9956A', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  retryBtnText: { color: '#1a0a2e', fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#F5E6D0' },
  scroll: { flex: 1 },
  interpretationText: { color: '#D4C4B0', fontSize: 16, lineHeight: 26 },
  feedbackBtn: { backgroundColor: '#C9956A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  feedbackBtnText: { color: '#1a0a2e', fontSize: 16, fontWeight: '700' },
});
