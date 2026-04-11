import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { TarotCard } from './TarotCard';
import { DrawnCard } from '@/types/card';

interface CardFanProps {
  cards: DrawnCard[];
  revealedCount: number;
  onRevealCard: (index: number) => void;
}

export function CardFan({ cards, revealedCount, onRevealCard }: CardFanProps) {
  const fanAngles = cards.map((_, i) => {
    const spread = 15 * (cards.length - 1);
    return -spread / 2 + i * 15;
  });

  return (
    <View style={styles.container}>
      {cards.map((card, index) => {
        const angle = fanAngles[index] ?? 0;
        const translateX = index * 4 - (cards.length * 2);

        return (
          <Animated.View
            key={card.cardId + index}
            style={[
              styles.cardWrapper,
              {
                transform: [
                  { translateX },
                  { rotate: `${angle}deg` },
                ],
                zIndex: index,
              },
            ]}
          >
            <TarotCard
              card={card}
              revealed={index < revealedCount}
              onReveal={() => onRevealCard(index)}
              width={90}
              height={155}
            />
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  cardWrapper: {
    position: 'absolute',
  },
});
