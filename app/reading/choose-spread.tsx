import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SPREADS } from '@/lib/spreads';
import { SpreadType } from '@/types/card';
import { supabase } from '@/lib/supabase';
import { isGuestMode } from '@/lib/guest';
import { canUseSpread } from '@/lib/subscription-tiers';
import { SubscriptionTier } from '@/types/user';
import { C } from '@/lib/colors';

export default function ChooseSpreadScreen() {
  const params = useLocalSearchParams<{ onboarding_summary: string; input_mode: string }>();
  const [selected, setSelected] = useState<SpreadType>('three_card');
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    async function load() {
      const guestMode = await isGuestMode();
      setGuest(guestMode);
      if (guestMode) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('user_profiles').select('subscription_tier').eq('id', user.id).single();
      if (data?.subscription_tier) setTier(data.subscription_tier as SubscriptionTier);
    }
    load();
  }, []);

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
      <Text style={styles.title}>Lege-Art wählen</Text>
      {guest && (
        <Text style={styles.guestHint}>🔍 Testmodus — alle Legearten verfügbar</Text>
      )}

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {SPREADS.map((spread) => {
          const unlocked = guest || canUseSpread(tier, spread.id);
          const name = spread.name['de'] ?? spread.name['en'];
          const isSelected = selected === spread.id;

          return (
            <TouchableOpacity
              key={spread.id}
              style={[styles.item, isSelected && styles.itemOn, !unlocked && styles.itemLocked]}
              onPress={() => unlocked && setSelected(spread.id)}
              activeOpacity={unlocked ? 0.8 : 1}
            >
              <View style={styles.itemContent}>
                <Text style={[styles.itemName, isSelected && styles.itemNameOn]}>{name}</Text>
                <Text style={styles.itemCards}>
                  {spread.cardCount} {spread.cardCount === 1 ? 'Karte' : 'Karten'}
                </Text>
              </View>
              {!unlocked && <Text style={styles.lock}>🔒</Text>}
              {isSelected && <Text style={styles.check}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextBtnText}>Weiter →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg, padding: 24, gap: 16 },
  title:     { fontSize: 22, fontWeight: '800', color: C.white },
  guestHint: { color: C.textMuted, fontSize: 13 },
  scroll:    { flex: 1 },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 10,
    borderWidth: 1.5, borderColor: C.border,
  },
  itemOn:     { borderColor: C.gold, backgroundColor: C.surfaceUp },
  itemLocked: { opacity: 0.4 },
  itemContent: { gap: 3 },
  itemName:    { color: C.white, fontSize: 16, fontWeight: '600' },
  itemNameOn:  { color: C.gold },
  itemCards:   { color: C.textMuted, fontSize: 13 },
  lock:  { fontSize: 18 },
  check: { color: C.gold, fontSize: 18, fontWeight: '700' },
  nextBtn: { backgroundColor: C.gold, borderRadius: 14, paddingVertical: 17, alignItems: 'center' },
  nextBtnText: { color: C.bg, fontSize: 16, fontWeight: '800' },
});
