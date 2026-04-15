/**
 * ParticleField — native fallback (no-op).
 * CosmicBackground already handles stars via RN Animated on native.
 */
import React from 'react';

interface Props {
  count?: number;
  style?: object;
}

export function ParticleField(_props: Props) {
  return null;
}
