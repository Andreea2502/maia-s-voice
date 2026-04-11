import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SPREADS } from '@/lib/spreads';
import { SpreadType } from '@/types/card';
import { useLanguage } from '@/hooks/useLanguage';
import { useSubscription } from '@/hooks/useSubscription';
import { useSupabase } from '@/hooks/useSupabase';

export default function ChooseSpreadScreen() {
  const { t, language } = useLanguage();
  const params = useLocalSearchParams<{ onboarding_summary: string; input_mode: string }>();
  const supabase = useSupabase();
  const [userId, setUserId] = React.useState<string>();

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const { canUseSpread } = useSubscription(userId);
  const [selected, setSelected] = useState<SpreadType>('three_card');

  function handleNext() {
    router.push({
      pathname: '/reading/question',
      params: {
        spread_type: selected,
        onboarding_summary: params.onboarding_summary,
        input_mode: params.input_mode,
      },
    });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('reading.choose_spread')}</Text>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {SPREADS.map((spread) => {
          const unlocked = canUseSpread(spread.id);
          const name = spread.name[language] ?? spread.name['de'];
          const isSelected = selected === spread.id;

          return (
            <TouchableOpacity
              key={spread.id}
              style={[
                styles.spreadItem,
                isSelected && styles.spreadItemSelected,
                !unlocked && styles.spreadItemLocked,
              ]}
              onPress={() => unlocked && setSelected(spread.id)}
              activeOpacity={unlocked ? 0.8 : 1}
            >
              <View style={styles.spreadItemContent}>
                <Text style={[styles.spreadName, isSelected && styles.spreadNameSelected]}>
                  {name}
                </Text>
                <Text style={styles.spreadCards}>
                  {spread.cardCount} {spread.cardCount === 1 ? 'Karte' : 'Karten'}
                </Text>
              </View>
              {!unlocked && <Text style={styles.lockIcon}>🔒</Text>}
              {isSelected && <Text style={styles.checkIcon}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextBtnText}>{t('common.continue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E', padding: 24, gap: 20 },
  title: { fontSize: 22, fontWeight: '700', color: '#F5E6D0' },
  scroll: { flex: 1 },
  spreadItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff08',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#ffffff11',
  },
  spreadItemSelected: { borderColor: '#C9956A', backgroundColor: '#C9956A11' },
  spreadItemLocked: { opacity: 0.4 },
  spreadItemContent: { gap: 2 },
  spreadName: { color: '#F5E6D0', fontSize: 16, fontWeight: '600' },
  spreadNameSelected: { color: '#C9956A' },
  spreadCards: { color: '#666', fontSize: 13 },
  lockIcon: { fontSize: 18 },
  checkIcon: { color: '#C9956A', fontSize: 18, fontWeight: '700' },
  nextBtn: {
    backgroundColor: '#C9956A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnText: { color: '#1a0a2e', fontSize: 16, fontWeight: '700' },
});
