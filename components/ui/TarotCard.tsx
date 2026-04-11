import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { DrawnCard } from '@/types/card';
import { getCardById } from '@/lib/card-data';
import { useLanguage } from '@/hooks/useLanguage';

interface TarotCardProps {
  card: DrawnCard;
  revealed: boolean;
  onReveal?: () => void;
  width?: number;
  height?: number;
}

export function TarotCard({ card, revealed, onReveal, width = 100, height = 170 }: TarotCardProps) {
  const { language, t } = useLanguage();
  const rotation = useSharedValue(revealed ? 180 : 0);

  React.useEffect(() => {
    rotation.value = withTiming(revealed ? 180 : 0, { duration: 600 });
  }, [revealed]);

  const frontStyle = useAnimatedStyle(() => {
    const rot = interpolate(rotation.value, [0, 180], [180, 360], Extrapolation.CLAMP);
    return {
      transform: [{ rotateY: `${rot}deg` }],
      opacity: rotation.value > 90 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const rot = interpolate(rotation.value, [0, 180], [0, 180], Extrapolation.CLAMP);
    return {
      transform: [{ rotateY: `${rot}deg` }],
      opacity: rotation.value < 90 ? 1 : 0,
    };
  });

  const cardData = getCardById(card.cardId);
  const cardName = cardData?.nameTranslations[language] ?? cardData?.nameTranslations['de'] ?? card.cardId;
  const isReversed = card.orientation === 'reversed';

  return (
    <TouchableOpacity onPress={!revealed ? onReveal : undefined} activeOpacity={0.85}>
      <View style={[styles.container, { width, height }]}>
        {/* Card Back */}
        <Animated.View style={[styles.face, styles.back, { width, height }, backStyle]}>
          <View style={styles.backPattern}>
            <Text style={styles.backSymbol}>✦</Text>
          </View>
        </Animated.View>

        {/* Card Front */}
        <Animated.View style={[styles.face, styles.front, { width, height }, frontStyle]}>
          <View style={[styles.cardContent, isReversed && styles.reversed]}>
            <View style={styles.cardInner}>
              <Text style={styles.cardNumber}>{cardData?.number !== undefined ? `${cardData.number}` : ''}</Text>
              <Text style={styles.cardSymbol}>⟡</Text>
              <Text style={styles.cardName} numberOfLines={2}>{cardName}</Text>
              {isReversed && <Text style={styles.reversedBadge}>{t('reading.reversed')}</Text>}
            </View>
          </View>
        </Animated.View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  face: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 10,
    backfaceVisibility: 'hidden',
    overflow: 'hidden',
  },
  back: {
    backgroundColor: '#1a0a2e',
    borderWidth: 1,
    borderColor: '#C9956A44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPattern: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D0A1E',
  },
  backSymbol: {
    fontSize: 32,
    color: '#C9956A66',
  },
  front: {
    backgroundColor: '#12092a',
    borderWidth: 1,
    borderColor: '#C9956A88',
  },
  cardContent: {
    flex: 1,
    padding: 8,
  },
  reversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardNumber: {
    color: '#C9956A88',
    fontSize: 10,
    fontWeight: '300',
  },
  cardSymbol: {
    fontSize: 24,
    color: '#C9956A',
  },
  cardName: {
    color: '#F5E6D0',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14,
  },
  reversedBadge: {
    color: '#C9956A',
    fontSize: 8,
    marginTop: 4,
  },
});
