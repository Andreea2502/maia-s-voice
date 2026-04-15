/**
 * GlowOrb — pulsing magical orb for voice/loading states.
 * Pure RN Animated. No external deps.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

type OrbState = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended' | 'error';

const STATE_COLORS: Record<OrbState, { ring: string; fill: string; glow: string }> = {
  idle:       { ring: '#2A2A3E', fill: '#12121F', glow: '#00000000' },
  connecting: { ring: '#C8A96E', fill: '#1A1508',  glow: '#C8A96E33' },
  listening:  { ring: '#00D4FF', fill: '#001A22',  glow: '#00D4FF44' },
  thinking:   { ring: '#8B00FF', fill: '#0D001A',  glow: '#8B00FF44' },
  speaking:   { ring: '#FF00AA', fill: '#1A0011',  glow: '#FF00AA44' },
  ended:      { ring: '#2A2A3E', fill: '#12121F',  glow: '#00000000' },
  error:      { ring: '#FF4444', fill: '#1A0000',  glow: '#FF444433' },
};

interface Props {
  state?: OrbState;
  icon?: string;
  size?: number;
}

export function GlowOrb({ state = 'idle', icon = '✦', size = 130 }: Props) {
  const pulseScale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.2)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const colors = STATE_COLORS[state];
  const isActive = state === 'listening' || state === 'speaking' || state === 'thinking';

  useEffect(() => {
    if (isActive) {
      // Pulse ring
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseScale, { toValue: 1.12, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseScale, { toValue: 1,    duration: 900, useNativeDriver: true }),
        ])
      );
      // Glow breathe
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.7, duration: 900, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.2, duration: 900, useNativeDriver: true }),
        ])
      );
      pulse.start();
      glow.start();
      return () => { pulse.stop(); glow.stop(); };
    } else {
      pulseScale.setValue(1);
      glowOpacity.setValue(0.15);
    }
  }, [state]);

  // Slow continuous rotation for thinking state
  useEffect(() => {
    if (state === 'thinking') {
      const rot = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );
      rot.start();
      return () => rot.stop();
    } else {
      rotateAnim.setValue(0);
    }
  }, [state]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const outerSize = size;
  const innerSize = Math.round(size * 0.77);
  const glowSize = Math.round(size * 1.4);

  return (
    <View style={[styles.container, { width: glowSize, height: glowSize }]}>
      {/* Outer glow */}
      <Animated.View
        style={[
          styles.glow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: colors.glow.slice(0, 7),
            opacity: glowOpacity,
          },
        ]}
      />

      {/* Ring */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: outerSize,
            height: outerSize,
            borderRadius: outerSize / 2,
            borderColor: colors.ring,
            transform: [{ scale: pulseScale }, { rotate }],
          },
        ]}
      >
        {/* Inner fill */}
        <View
          style={[
            styles.inner,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: colors.fill,
            },
          ]}
        >
          <Text style={[styles.icon, { color: colors.ring }]}>{icon}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
  },
  ring: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 36,
  },
});
