import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSupabase } from '@/hooks/useSupabase';
import { useLanguage } from '@/hooks/useLanguage';
import { useSubscription } from '@/hooks/useSubscription';
import { UserProfile } from '@/types/user';
import { Reading } from '@/types/reading';

export default function HomeScreen() {
  const supabase = useSupabase();
  const { t } = useLanguage();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
  const { tier, readingsThisMonth, hasReadingsLeft, tierConfig } = useSubscription(profile?.id);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    const [{ data: profileData }, { data: readingsData }] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase.from('readings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    ]);

    setProfile(profileData);
    setRecentReadings(readingsData ?? []);
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting_morning');
    if (hour < 18) return t('home.greeting_afternoon');
    return t('home.greeting_evening');
  }

  const readingsLeft = tierConfig?.readingsPerMonth === -1 ? '∞' :
    Math.max(0, (tierConfig?.readingsPerMonth ?? 2) - readingsThisMonth);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}{profile?.displayName ? `, ${profile.displayName}` : ''}</Text>
        <View style={styles.readingsBadge}>
          <Text style={styles.readingsLeft}>
            {typeof readingsLeft === 'number'
              ? t('home.readings_left').replace('{{count}}', String(readingsLeft))
              : `∞ ${t('home.readings_left').replace('{{count}}', '∞')}`}
          </Text>
        </View>
      </View>

      {/* Daily card CTA */}
      <TouchableOpacity
        style={styles.startCard}
        onPress={() => {
          if (!hasReadingsLeft()) {
            router.push('/settings/subscription');
          } else {
            router.push('/reading/onboarding');
          }
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.startCardEmoji}>✦</Text>
        <Text style={styles.startCardTitle}>{t('home.start_reading')}</Text>
        <Text style={styles.startCardArrow}>→</Text>
      </TouchableOpacity>

      {/* Daily card */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.daily_card')}</Text>
        <View style={styles.dailyCard}>
          <Text style={styles.dailyCardSymbol}>⟡</Text>
          <Text style={styles.dailyCardName}>Der Stern</Text>
          <Text style={styles.dailyCardKeyword}>Hoffnung · Erneuerung · Heilung</Text>
        </View>
      </View>

      {/* Recent readings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.recent_readings')}</Text>
        {recentReadings.length === 0 ? (
          <Text style={styles.emptyText}>{t('home.no_readings')}</Text>
        ) : (
          recentReadings.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.readingItem}
              onPress={() => { /* navigate to reading detail */ }}
            >
              <View>
                <Text style={styles.readingDate}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.readingSpread}>{r.spreadType}</Text>
              </View>
              <Text style={styles.readingArrow}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E' },
  content: { padding: 24, gap: 24, paddingBottom: 60 },
  header: { gap: 8 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#F5E6D0', letterSpacing: 0.3 },
  readingsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#C9956A22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#C9956A44',
  },
  readingsLeft: { color: '#C9956A', fontSize: 12, fontWeight: '600' },
  startCard: {
    backgroundColor: '#1a0a2e',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#C9956A66',
  },
  startCardEmoji: { fontSize: 28, color: '#C9956A' },
  startCardTitle: { fontSize: 18, fontWeight: '700', color: '#F5E6D0', flex: 1, marginLeft: 12 },
  startCardArrow: { fontSize: 22, color: '#C9956A' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 1.5 },
  dailyCard: {
    backgroundColor: '#12092a',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#C9956A33',
  },
  dailyCardSymbol: { fontSize: 32, color: '#C9956A' },
  dailyCardName: { fontSize: 18, fontWeight: '700', color: '#F5E6D0' },
  dailyCardKeyword: { fontSize: 13, color: '#888' },
  emptyText: { color: '#555', fontSize: 14, textAlign: 'center', lineHeight: 22 },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff08',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ffffff11',
  },
  readingDate: { color: '#aaa', fontSize: 12 },
  readingSpread: { color: '#F5E6D0', fontSize: 14, fontWeight: '600' },
  readingArrow: { color: '#C9956A', fontSize: 20 },
});
