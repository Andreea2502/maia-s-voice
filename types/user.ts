export type SupportedLanguage =
  | 'ar' | 'hi' | 'rom' | 'tr' | 'fa' | 'ro' | 'hu' | 'de' | 'en';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'unlimited';

export type PersonaId =
  | 'mystic_elena'
  | 'sage_amira'
  | 'guide_priya';

export interface UserProfile {
  id: string;
  displayName?: string;
  preferredLanguage: SupportedLanguage;
  preferredPersona: PersonaId;
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
