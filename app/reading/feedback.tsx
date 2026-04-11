import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';

export default function FeedbackScreen() {
  const supabase = useSupabase();
  const { t } = useLanguage();
  const { reading_id } = useLocalSearchParams<{ reading_id: string }>();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (reading_id) {
      await supabase.from('readings').update({ user_rating: rating, user_feedback: comment }).eq('id', reading_id);
    }
    setSubmitted(true);
    setTimeout(() => router.replace('/(tabs)/'), 1500);
  }

  if (submitted) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.thankYou}>✦</Text>
        <Text style={styles.thankYouText}>{t('feedback.thank_you')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('feedback.title')}</Text>
      <Text style={styles.subtitle}>{t('feedback.subtitle')}</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity key={star} onPress={() => setRating(star)}>
            <Text style={[styles.star, star <= rating && styles.starActive]}>★</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        value={comment}
        onChangeText={setComment}
        placeholder={t('feedback.comment_placeholder')}
        placeholderTextColor="#555"
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
        <Text style={styles.submitBtnText}>{t('feedback.submit')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/(tabs)/')}>
        <Text style={styles.skipText}>{t('feedback.skip')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E', padding: 28, gap: 20, justifyContent: 'center' },
  centerContainer: { flex: 1, backgroundColor: '#0D0A1E', alignItems: 'center', justifyContent: 'center', gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5E6D0', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  star: { fontSize: 36, color: '#333' },
  starActive: { color: '#C9956A' },
  input: {
    backgroundColor: '#ffffff0d',
    borderWidth: 1,
    borderColor: '#ffffff22',
    borderRadius: 14,
    padding: 14,
    color: '#F5E6D0',
    fontSize: 15,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  submitBtn: { backgroundColor: '#C9956A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#1a0a2e', fontSize: 16, fontWeight: '700' },
  skipText: { color: '#555', textAlign: 'center', fontSize: 14 },
  thankYou: { fontSize: 48, color: '#C9956A' },
  thankYouText: { color: '#F5E6D0', fontSize: 18, fontWeight: '600' },
});
