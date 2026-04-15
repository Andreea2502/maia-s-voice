/**
 * CosmicBackground — Video background (native + web) with star overlay.
 * Uses expo-av Video for native, HTML5 <video> for web.
 */
import React, { useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, Dimensions, Platform } from 'react-native';
import { ParticleField } from './ParticleField';

const { width: W, height: H } = Dimensions.get('screen');

// ─── Star overlay ─────────────────────────────────────────────
interface Star {
  x: number; y: number; size: number; color: string;
  anim: Animated.Value; delay: number; duration: number;
}
const STAR_COLORS = ['#FFFFFF', '#00D4FF', '#D4AF5A', '#B8CCE8'];

function randomBetween(a: number, b: number) { return a + Math.random() * (b - a); }

function buildStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    x: randomBetween(0, W), y: randomBetween(0, H),
    size: randomBetween(0.8, 2.5),
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    anim: new Animated.Value(randomBetween(0.1, 0.5)),
    delay: randomBetween(0, 4000), duration: randomBetween(2000, 5000),
  }));
}

function StarDot({ star }: { star: Star }) {
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(star.anim, { toValue: randomBetween(0.6, 1),   duration: star.duration, useNativeDriver: true }),
        Animated.timing(star.anim, { toValue: randomBetween(0.05, 0.25), duration: star.duration, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', left: star.x, top: star.y,
      width: star.size, height: star.size, borderRadius: star.size,
      backgroundColor: star.color, opacity: star.anim,
    }} />
  );
}

// ─── Web video background ─────────────────────────────────────
function WebVideoBackground() {
  return (
    <video
      autoPlay muted loop playsInline
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        objectFit: 'cover', zIndex: 0,
        opacity: 0.85,
      }}
    >
      <source src={require('../../assets/bg-cosmic.mp4')} type="video/mp4" />
    </video>
  );
}

// ─── Native video background ──────────────────────────────────
function NativeVideoBackground() {
  // Lazy import to avoid loading expo-av on web
  const { Video, ResizeMode } = require('expo-av');
  return (
    <Video
      source={require('../../assets/bg-cosmic.mp4')}
      style={StyleSheet.absoluteFill}
      resizeMode={ResizeMode.COVER}
      shouldPlay
      isLooping
      isMuted
      useNativeControls={false}
    />
  );
}

// ─── Dark overlay gradient (navy tint over video) ─────────────
function DarkOverlay() {
  return (
    <>
      <View style={styles.overlayBase} />
      <View style={styles.overlayVignette} />
    </>
  );
}

// ─── Nebula blobs ─────────────────────────────────────────────
function NebulaBlobLayer() {
  const blobs = useMemo(() => [
    { x: W * 0.5,  y: H * 0.28, r: 260, color: '#1A6AFF', opacity: 0.06 },
    { x: W * 0.1,  y: H * 0.15, r: 180, color: '#00D4FF', opacity: 0.05 },
    { x: W * 0.85, y: H * 0.3,  r: 140, color: '#D4AF5A', opacity: 0.04 },
    { x: W * 0.5,  y: H * 0.6,  r: 220, color: '#0A4080', opacity: 0.05 },
    { x: W * 0.15, y: H * 0.75, r: 130, color: '#00D4FF', opacity: 0.04 },
    { x: W * 0.8,  y: H * 0.8,  r: 160, color: '#6B4FA0', opacity: 0.05 },
  ], []);

  return (
    <>
      {blobs.map((b, i) => (
        <View key={i} style={{
          position: 'absolute',
          left: b.x - b.r, top: b.y - b.r,
          width: b.r * 2, height: b.r * 2,
          borderRadius: b.r,
          backgroundColor: b.color,
          opacity: b.opacity,
        }} />
      ))}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────
interface Props {
  starCount?: number;
  children?: React.ReactNode;
  style?: object;
  showVideo?: boolean;   // default true
}

export function CosmicBackground({ starCount = 60, children, style, showVideo = true }: Props) {
  const stars = useMemo(() => buildStars(starCount), [starCount]);

  return (
    <View style={[styles.root, style]}>
      {/* Fallback solid background */}
      <View style={styles.bgBase} />

      {/* Video layer */}
      {showVideo && (
        Platform.OS === 'web'
          ? <WebVideoBackground />
          : <NativeVideoBackground />
      )}

      {/* Dark overlay to ensure readability */}
      <DarkOverlay />

      {/* Soft nebula color tints */}
      <NebulaBlobLayer />

      {/* Twinkling stars */}
      {stars.map((s, i) => <StarDot key={i} star={s} />)}

      {/* Three.js / Canvas particles (web only) */}
      {Platform.OS === 'web' && (
        <ParticleField count={starCount * 4} />
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#091428',
    overflow: 'hidden',
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#091428',
  },
  overlayBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#091428',
    opacity: 0.45,
  },
  overlayVignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    opacity: 0.2,
  },
});
