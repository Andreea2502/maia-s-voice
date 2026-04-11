export type SupportedLanguage = 'ar'|'hi'|'rom'|'tr'|'fa'|'ro'|'hu'|'de'|'en';
export type PersonaId = 'mystic_elena' | 'sage_amira' | 'guide_priya';
export type SpreadType = 'single'|'three_card'|'celtic_cross'|'love_spread'|'career_spread'|'yes_no'|'past_present_future';
export type InputMode = 'voice' | 'text';

export interface UserProfile {
  id: string;
  display_name?: string;
  preferred_language: SupportedLanguage;
  preferred_persona: PersonaId;
  voice_consent: boolean;
  data_retention_consent: boolean;
  onboarding_completed: boolean;
  life_context_summary: Record<string, unknown>;
  subscription_tier: 'free'|'basic'|'premium'|'unlimited';
  readings_this_month: number;
}

export interface DrawnCard {
  position: number;
  card_id: string;
  orientation: 'upright' | 'reversed';
  recognized_from_photo: boolean;
}

export interface CardMeaning {
  id: string;
  name: string;
  meaning: string;
  visual_description?: string;
}
