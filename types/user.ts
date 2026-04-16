export type SupportedLanguage = 'de' | 'en' | 'ro' | 'hu' | 'rom';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'unlimited';

export interface UserProfile {
  id: string;
  displayName?: string;
  preferredLanguage: SupportedLanguage;
  preferredPersona: string;  // PersonaId — import from @/lib/personas
  voiceConsent: boolean;
  dataRetentionConsent: boolean;
  dataRetentionMonths: number;
  onboardingCompleted: boolean;
  lifeContextSummary: LifeContextSummary;
  subscriptionTier: SubscriptionTier;
  readingsThisMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface LifeContextSummary {
  currentSituation?: string;
  mainConcerns?: string[];
  emotionalState?: string;
  culturalBackground?: string;
  spiritualExperienceLevel?: 'beginner' | 'intermediate' | 'experienced';
}

export type ConsentType =
  | 'voice_recording'
  | 'data_retention'
  | 'sensitive_data_processing'
  | 'marketing'
  | 'analytics'
  | 'terms_of_service'
  | 'privacy_policy';
