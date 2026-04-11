import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SpreadLayout } from '@/components/ui/SpreadLayout';
import { useCardDraw } from '@/hooks/useCardDraw';
import { useLanguage } from '@/hooks/useLanguage';
import { SpreadType } from '@/types/card';

export default function DrawCardsScreen() {
  const { t } = useLanguage();
  const params = useLocalSearchParams<{
    spread_type: string; question: string;
    onboarding_summary: string; input_mode: string; reading_type: string;
  }>();
  const spreadType = (params.spread_type as SpreadType) ?? 'three_card';

  const { cards, revealedCount, allRevealed, loading, drawCards, revealCard } = useCardDraw();

  useEffect(() => { drawCards(spreadType); }, [spreadType]);

  function handleGetInterpretation() {
    router.push({
      pathname: '/reading/interpretation',
      params: {
        spread_type: spreadType,
        question: params.question,
        onboarding_summary: params.onboarding_summary,
        input_mode: params.input_mode,
        reading_type: params.reading_type,
        cards_json: JSON.stringify(cards),
      },
    });
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C9956A" />
        <Text style={styles.loadingText}>{t('reading.drawing_cards')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>
        {!allRevealed ? t('reading.tap_to_reveal') : t('reading.all_revealed')}
      </Text>

      <View style={styles.cardsArea}>
        {cards.length > 0 && (
          <SpreadLayout
            spreadType={spreadType}
            cards={cards}
            revealedCount={revealedCount}
            onRevealCard={revealCard}
          />
        )}
      </View>

      {allRevealed && (
        <TouchableOpacity style={styles.interpretBtn} onPress={handleGetInterpretation}>
          <Text style={styles.interpretBtnText}>{t('reading.get_interpretation')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0A1E', padding: 24, gap: 24, justifyContent: 'center' },
  loadingContainer: { flex: 1, backgroundColor: '#0D0A1E', alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { color: '#888', fontSize: 14 },
  hint: { color: '#888', fontSize: 14, textAlign: 'center', letterSpacing: 0.5 },
  cardsArea: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  interpretBtn: {
    backgroundColor: '#C9956A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  interpretBtnText: { color: '#1a0a2e', fontSize: 16, fontWeight: '700' },
});
