import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { TarotCard } from './TarotCard';
import { DrawnCard, SpreadType } from '@/types/card';
import { getSpread } from '@/lib/spreads';
import { useLanguage } from '@/hooks/useLanguage';

interface SpreadLayoutProps {
  spreadType: SpreadType;
  cards: DrawnCard[];
  revealedCount: number;
  onRevealCard: (index: number) => void;
}

export function SpreadLayout({ spreadType, cards, revealedCount, onRevealCard }: SpreadLayoutProps) {
  const { language } = useLanguage();
  const spread = getSpread(spreadType);

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.container}
      showsHorizontalScrollIndicator={false}
    >
      {cards.map((card, index) => {
        const position = spread.positions[index];
        const positionLabel = position?.meaning[language] ?? position?.meaning['de'] ?? `${index + 1}`;
        return (
          <View key={index} style={styles.cardSlot}>
            <Text style={styles.positionLabel}>{positionLabel}</Text>
            <TarotCard
              card={card}
              revealed={index < revealedCount}
              onReveal={() => onRevealCard(index)}
              width={100}
              height={170}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  cardSlot: {
    alignItems: 'center',
    gap: 8,
  },
  positionLabel: {
    color: '#C9956A',
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 100,
    lineHeight: 14,
  },
});
