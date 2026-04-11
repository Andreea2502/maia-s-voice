import { SpreadType, DrawnCard } from './card';
import { SupportedLanguage } from './user';

export type ReadingType = 'virtual' | 'photo_upload';

export type ReadingStep =
  | { step: 'idle' }
  | { step: 'consent_check' }
  | { step: 'persona_intro' }
  | { step: 'choose_input_mode' }
  | { step: 'voice_onboarding'; sessionId: string }
  | { step: 'text_onboarding' }
  | { step: 'choose_method' }
  | { step: 'virtual_draw'; spreadType: SpreadType }
  | { step: 'photo_upload' }
  | { step: 'card_recognition'; imageUri: string }
  | { step: 'card_confirmation'; cards: import('./card').RecognizedCard[] }
  | { step: 'generating_interpretation'; readingId: string }
  | { step: 'interpretation'; readingId: string; interpretation: string }
  | { step: 'feedback'; readingId: string }
  | { step: 'error'; message: string; recoveryAction?: () => void };

export interface Reading {
  id: string;
  userId: string;
  readingType: ReadingType;
  spreadType: SpreadType;
  question?: string;
  cards: DrawnCard[];
  onboardingSummary?: string;
  interpretation?: string;
  interpretationLanguage: SupportedLanguage;
  voiceUsed: boolean;
  photoUrls: string[];
  emotionalTone?: string;
  recurringThemes: string[];
  userRating?: number;
  userFeedback?: string;
  durationSeconds?: number;
  costCents: number;
  createdAt: string;
}

export interface SessionMemory {
  id: string;
  userId: string;
  memoryType:
    | 'life_event'
    | 'emotional_pattern'
    | 'recurring_question'
    | 'preference'
    | 'relationship'
    | 'goal'
    | 'concern';
  content: string;
  importanceScore: number;
  sourceReadingId?: string;
  expiresAt?: string;
  createdAt: string;
}
