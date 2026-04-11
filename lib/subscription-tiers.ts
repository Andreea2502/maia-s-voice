import { SubscriptionTier } from '@/types/user';
import { SpreadType } from '@/types/card';
import { PersonaId } from '@/types/user';

interface TierConfig {
  readingsPerMonth: number;
  voiceOnboarding: boolean;
  voiceInterpretation: boolean;
  photoUpload: boolean;
  sessionMemory: boolean;
  personas: PersonaId[] | 'all';
  spreads: SpreadType[] | 'all';
  priceMonthlyEur?: number;
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  free: {
    readingsPerMonth: 2,
    voiceOnboarding: true,
    voiceInterpretation: false,
    photoUpload: false,
    sessionMemory: false,
    personas: ['mystic_elena'],
    spreads: ['single', 'three_card'],
  },
  basic: {
    readingsPerMonth: 10,
    voiceOnboarding: true,
    voiceInterpretation: false,
    photoUpload: true,
    sessionMemory: true,
    personas: ['mystic_elena', 'sage_amira'],
    spreads: ['single', 'three_card', 'past_present_future', 'yes_no'],
    priceMonthlyEur: 4.99,
  },
  premium: {
    readingsPerMonth: 30,
    voiceOnboarding: true,
    voiceInterpretation: true,
    photoUpload: true,
    sessionMemory: true,
    personas: 'all',
    spreads: 'all',
    priceMonthlyEur: 9.99,
  },
  unlimited: {
    readingsPerMonth: -1,
    voiceOnboarding: true,
    voiceInterpretation: true,
    photoUpload: true,
    sessionMemory: true,
    personas: 'all',
    spreads: 'all',
    priceMonthlyEur: 19.99,
  },
};

export function canUsePersona(tier: SubscriptionTier, personaId: PersonaId): boolean {
  const config = TIERS[tier];
  if (config.personas === 'all') return true;
  return config.personas.includes(personaId);
}

export function canUseSpread(tier: SubscriptionTier, spreadType: SpreadType): boolean {
  const config = TIERS[tier];
  if (config.spreads === 'all') return true;
  return config.spreads.includes(spreadType);
}

export function hasReadingsLeft(tier: SubscriptionTier, readingsThisMonth: number): boolean {
  const limit = TIERS[tier].readingsPerMonth;
  if (limit === -1) return true;
  return readingsThisMonth < limit;
}
