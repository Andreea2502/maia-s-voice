import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useLanguage } from '@/hooks/useLanguage';

export default function QuestionScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ spread_type: string; onboarding_summary: string; input_mode: string }>();
  const [question, setQuestion] = useState('');

  function handleNext(method: 'virtual' | 'photo') {
    router.push({
      pathname: method === 'virtual' ? '/reading/draw-cards' : '/reading/photo-upload',
      params: {
        spread_type: params.spread_type,
        question,
        onboarding_summary: params.onboarding_summary,
        input_mode: params.input_mode,
        reading_type: method,
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>{t('reading.choose_method_title')}</Text>

        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder={t('reading.question_placeholder')}
          placeholderTextColor="#555"
          multiline
          numberOfLines={3}
        />

        <View style={styles.methodBtns}>
          <TouchableOpacity style={[styles.methodBtn, styles.methodBtnPrimary]} onPress={() => handleNext('virtual')}>
            <Text style={styles.methodBtnEmoji}>🃏</Text>
            <Text style={styles.methodBtnPrimaryText}>{t('reading.virtual_draw')}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.methodBtn, styles.methodBtnSecondary]} onPress={() => handleNext('photo')}>
            <Text style={styles.methodBtnEmoji}>📷</Text>
            <Text style={styles.methodBtnSecondaryText}>{t('reading.photo_upload')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E' },
  inner: { flex: 1, padding: 24, justifyContent: 'center', gap: 24 },
  title: { fontSize: 20, fontWeight: '700', color: '#F5E6D0', textAlign: 'center' },
  input: {
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#ffffff22',
    borderRadius: 14,
    padding: 16,
    color: '#F5E6D0',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  methodBtns: { gap: 12 },
  methodBtn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  methodBtnPrimary: { backgroundColor: '#C9956A' },
  methodBtnSecondary: {
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#ffffff22',
  },
  methodBtnEmoji: { fontSize: 22 },
  methodBtnPrimaryText: { color: '#1a0a2e', fontSize: 16, fontWeight: '700' },
  methodBtnSecondaryText: { color: '#F5E6D0', fontSize: 16, fontWeight: '600' },
});
