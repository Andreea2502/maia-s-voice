import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface VoiceWaveformProps {
  active: boolean;
  color?: string;
  barCount?: number;
}

const BAR_COUNT = 7;

export function VoiceWaveform({ active, color = '#C9956A', barCount = BAR_COUNT }: VoiceWaveformProps) {
  const animations = Array.from({ length: barCount }, () => useSharedValue(0.3));

  useEffect(() => {
    animations.forEach((anim, i) => {
      if (active) {
        anim.value = withRepeat(
          withTiming(1, {
            duration: 400 + i * 80,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true
        );
      } else {
        cancelAnimation(anim);
        anim.value = withTiming(0.3, { duration: 200 });
      }
    });
  }, [active]);

  return (
    <View style={styles.container}>
      {animations.map((anim, i) => {
        const style = useAnimatedStyle(() => ({
          height: 12 + anim.value * 28,
          opacity: 0.6 + anim.value * 0.4,
        }));
        return (
          <Animated.View
            key={i}
            style={[styles.bar, { backgroundColor: color }, style]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 48,
  },
  bar: {
    width: 4,
    borderRadius: 2,
  },
});
