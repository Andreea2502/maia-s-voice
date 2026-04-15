import { SubscriptionTier } from '@/types/user';
import { PersonaId } from '@/lib/personas';

// ─── Kosten pro Session (intern, zur Orientierung) ──────────────────────────
// Voice-Session:  ElevenLabs ~1.50€ + Claude ~0.02€  = ~1.52€
// Text-Session:   Claude ~0.02€                       = ~0.02€
// Ziel-Marge:     mind. 3x Kostendeckung

export type InputMode = 'voice' | 'text';

interface TierConfig {
  // Readings
  textReadingsPerMonth: number;   // günstiger Modus
  voiceReadingsPerMonth: number;  // teurer Modus (ElevenLabs)

  // Features
  voiceMode: boolean;             // darf Voice-Modus nutzen
  textMode: boolean;              // darf Text-Modus nutzen
  photoUpload: boolean;           // Kaffeesatz / Palm Upload
  sessionMemory: boolean;         // Gesprächsgedächtnis über Sessions
  allPersonas: boolean;           // alle 3 Tarot-Personas (sonst nur Luna)

  // Preis
  priceMonthlyEur?: number;
  pricePerTextReadingEur?: number;   // für Pay-per-use
  pricePerVoiceReadingEur?: number;  // für Pay-per-use
}

export const TIERS: Record<SubscriptionTier, TierConfig> = {
  // Gratis: nur Text, 3 Readings zum Kennenlernen
  free: {
    textReadingsPerMonth: 3,
    voiceReadingsPerMonth: 0,
    voiceMode: false,
    textMode: true,
    photoUpload: false,
    sessionMemory: false,
    allPersonas: false,
  },

  // Basic 9,99€: Text unlimitiert + 5 Voice/Monat
  // Kalkulation: 5 Voice × 1,52€ = 7,60€ Kosten → Marge ~2,39€ (nach Serverkosten knapp)
  // → Voice hier auf 5/Monat begrenzen, Text unlimitiert
  basic: {
    textReadingsPerMonth: -1,      // unlimitiert
    voiceReadingsPerMonth: 5,
    voiceMode: true,
    textMode: true,
    photoUpload: true,
    sessionMemory: true,
    allPersonas: false,            // nur Luna
    priceMonthlyEur: 9.99,
    pricePerTextReadingEur: 1.49,
    pricePerVoiceReadingEur: 3.99,
  },

  // Premium 24,99€: Text unlimitiert + 15 Voice/Monat + alle Personas
  // Kalkulation: 15 Voice × 1,52€ = 22,80€ Kosten → Marge ~2,19€ (immer noch knapp)
  // Tipp: Voice auf 15/Monat und darüber hinaus 3,99€/Reading
  premium: {
    textReadingsPerMonth: -1,
    voiceReadingsPerMonth: 15,
    voiceMode: true,
    textMode: true,
    photoUpload: true,
    sessionMemory: true,
    allPersonas: true,
    priceMonthlyEur: 24.99,
    pricePerTextReadingEur: 0.99,
    pricePerVoiceReadingEur: 3.49,
  },

  // Unlimited 49,99€: alles unlimitiert
  // Kalkulation: bei tägl. Nutzung (30 Voice/Monat) = 45,60€ Kosten → Marge ~4,39€
  // Nur für Heavy-User sinnvoll — ist auch ein Commitment-Signal
  unlimited: {
    textReadingsPerMonth: -1,
    voiceReadingsPerMonth: -1,
    voiceMode: true,
    textMode: true,
    photoUpload: true,
    sessionMemory: true,
    allPersonas: true,
    priceMonthlyEur: 49.99,
  },
};

// Pay-per-use (kein Abo)
export const PAY_PER_USE = {
  textReading:  { eur: 1.99, label: 'Text-Reading' },
  voiceReading: { eur: 4.99, label: 'Voice-Reading' },
} as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

export function canUseVoice(tier: SubscriptionTier): boolean {
  return TIERS[tier].voiceMode;
}

export function canUsePersona(tier: SubscriptionTier, personaId: PersonaId): boolean {
  if (TIERS[tier].allPersonas) return true;
  return personaId === 'luna'; // luna is always available
}

export function hasReadingsLeft(
  tier: SubscriptionTier,
  mode: InputMode,
  usedThisMonth: number
): boolean {
  const limit = mode === 'voice'
    ? TIERS[tier].voiceReadingsPerMonth
    : TIERS[tier].textReadingsPerMonth;
  if (limit === -1) return true;
  return usedThisMonth < limit;
}
