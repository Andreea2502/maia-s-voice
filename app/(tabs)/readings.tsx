import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';
import { Reading } from '@/types/reading';

export default function ReadingsScreen() {
  const supabase = useSupabase();
  const { t } = useLanguage();
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReadings();
  }, []);

  async function loadReadings() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('readings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setReadings(data ?? []);
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('history.title')}</Text>
      {readings.length === 0 && !loading ? (
        <Text style={styles.empty}>{t('history.empty')}</Text>
      ) : (
        <FlatList
          data={readings}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          renderItem={({ item: r }) => (
            <View style={styles.card}>
              <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.spread}>{r.spreadType}</Text>
              {r.question ? <Text style={styles.question}>"{r.question}"</Text> : null}
              {r.emotionalTone ? <Text style={styles.tone}>{r.emotionalTone}</Text> : null}
              {r.userRating ? (
                <Text style={styles.rating}>{'★'.repeat(r.userRating)}</Text>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5E6D0', marginBottom: 16 },
  empty: { color: '#555', textAlign: 'center', marginTop: 60 },
  list: { gap: 12 },
  card: {
    backgroundColor: '#ffffff08',
    borderRadius: 14,
    padding: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  date: { color: '#888', fontSize: 12 },
  spread: { color: '#F5E6D0', fontSize: 16, fontWeight: '600' },
  question: { color: '#aaa', fontSize: 13, fontStyle: 'italic' },
  tone: { color: '#C9956A', fontSize: 12 },
  rating: { color: '#C9956A', fontSize: 14 },
});
