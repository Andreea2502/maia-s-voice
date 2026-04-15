import { ModuleId } from '@/lib/modules';
import { PersonaId } from '@/lib/personas';

export type ModuleReadingType = ModuleId;

export interface Reading {
  id: string;
  userId: string;
  module: ModuleReadingType;
  persona?: PersonaId | null;        // only for tarot
  spreadType?: string | null;        // only for tarot
  cardsDrawn?: any[] | null;         // only for tarot
  question?: string | null;
  aiInterpretation?: string | null;
  voiceAudioUrl?: string | null;
  mediaUploadUrl?: string | null;    // for coffee / palm photo
  emotionalTone?: string | null;
  userRating?: number | null;
  savedByUser: boolean;
  createdAt: string;
}

export interface SessionMemory {
  id: string;
  userId: string;
  module: ModuleReadingType;
  embedding?: number[] | null;
  summary: string;
  createdAt: string;
}

export interface UserContext {
  language: string;
  mood: string;
  mainConcern: string;
  lifeContext: string;
  deepQuestions: string[];
  timestamp: number;
  sessionId: string;
}
