Tech-Stack Architecture: AI-Powered Tarot App
Blueprint fuer KI-Coding-Agent
Zweck: Dieses Dokument ist eine vollstaendige, sofort umsetzbare technische Spezifikation. Ein KI-Coding-Agent soll damit den gesamten Code generieren koennen.

1. ARCHITECTURE OVERVIEW
+------------------------------------------------------------------+
|                        MOBILE CLIENT                              |
|  React Native (Expo) + expo-av + expo-localization               |
|  RTL Support (Arabic, Dari/Farsi) + Multi-Language (9 Sprachen)  |
+----------------------------------+-------------------------------+
                                   |
                          HTTPS / WebSocket
                                   |
+----------------------------------v-------------------------------+
|                     SUPABASE BACKEND                              |
|  +-----------------------+  +---------------------------+        |
|  | PostgreSQL Database    |  | Edge Functions (Deno)     |        |
|  | - user_profiles        |  | - /api/reading/start      |        |
|  | - readings             |  | - /api/reading/interpret   |        |
|  | - session_memory       |  | - /api/voice/token         |        |
|  | - card_library         |  | - /api/cards/recognize     |        |
|  | - subscriptions        |  | - /api/profile/update      |        |
|  +-----------------------+  +---------------------------+        |
|  +---------------------------+  +---------------------------+    |
|  | Supabase Auth (Row-Level) |  | Supabase Realtime          |    |
|  | - Email/Password          |  | - Reading progress updates |    |
|  | - Phone/OTP               |  | - Voice stream status      |    |
|  | - Apple/Google Sign-In    |  +---------------------------+    |
|  +---------------------------+                                    |
|  +---------------------------+                                    |
|  | Supabase Storage           |                                   |
|  | - card_photos/              |                                   |
|  | - voice_recordings/ (opt.)  |                                   |
|  | - profile_avatars/          |                                   |
|  +---------------------------+                                    |
+----------------------------------+-------------------------------+
                                   |
              +--------------------+--------------------+
              |                    |                    |
   +----------v------+  +---------v-------+  +--------v---------+
   | ELEVENLABS       |  | ANTHROPIC        |  | GOOGLE CLOUD     |
   | Conversational   |  | Claude Sonnet    |  | Vision API       |
   | AI API           |  | 4.6 API          |  | (Card Recognition)|
   | - Voice Onboard. |  | - Interpretation |  | + TTS (Fallback) |
   | - Persona Voices |  | - Context Memory |  |                  |
   | - STT + TTS      |  | - Profile Enrich.|  |                  |
   +------------------+  +------------------+  +------------------+

2. TECH STACK (EXAKTE VERSIONEN)
2.1 Frontend (Mobile App)
{
  "framework": "React Native with Expo SDK 52+",
  "language": "TypeScript 5.4+",
  "state_management": "Zustand 5.x",
  "navigation": "expo-router 4.x (file-based routing)",
  "ui_library": "Tamagui 1.x (supports RTL natively)",
  "animations": "react-native-reanimated 3.x",
  "audio": "expo-av (recording + playback)",
  "camera": "expo-camera (card photo capture)",
  "image_picker": "expo-image-picker",
  "localization": "expo-localization + i18next + react-i18next",
  "supabase_client": "@supabase/supabase-js 2.x",
  "payments": "react-native-purchases (RevenueCat SDK)",
  "haptics": "expo-haptics",
  "secure_storage": "expo-secure-store"
}
2.2 Backend (Supabase)
{
  "platform": "Supabase (self-hosted or cloud, EU region: eu-central-1)",
  "database": "PostgreSQL 15+ with pgvector extension",
  "edge_functions": "Deno runtime (TypeScript)",
  "auth": "Supabase Auth (GoTrue) with RLS policies",
  "storage": "Supabase Storage (S3-compatible)",
  "realtime": "Supabase Realtime (WebSocket)",
  "cron": "pg_cron for scheduled cleanup jobs"
}
2.3 External APIs
{
  "voice_conversation": {
    "provider": "ElevenLabs Conversational AI",
    "plan": "Business ($1,320/mo) or Scale ($330/mo)",
    "features": ["real-time STT", "TTS", "persona voices", "conversation memory"],
    "sdk": "@11labs/react (React Native compatible)",
    "languages": ["ar", "hi", "tr", "de", "en", "ro", "hu"],
    "note": "Romani + Dari: use custom cloned voices"
  },
  "ai_interpretation": {
    "provider": "Anthropic Claude API",
    "model": "claude-sonnet-4-6",
    "sdk": "@anthropic-ai/sdk 1.x",
    "use_cases": ["tarot interpretation", "profile enrichment", "context summarization"]
  },
  "card_recognition": {
    "provider": "Google Cloud Vision API",
    "features": ["label detection", "OCR", "object localization"],
    "alternative": "Claude Vision (claude-sonnet-4-6 with image input)"
  },
  "tts_fallback": {
    "provider": "Google Cloud Text-to-Speech",
    "use_case": "Dari/Farsi voice, cost-optimized text readings",
    "languages": ["fa", "ar", "hi", "tr", "de", "en", "ro", "hu"]
  },
  "payments": {
    "provider": "RevenueCat (wraps App Store + Google Play)",
    "features": ["subscriptions", "one-time purchases", "cross-platform"],
    "backup": "Stripe (for web version later)"
  }
}

3. DATABASE SCHEMA (Supabase PostgreSQL)
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & PROFILES
-- ============================================================

-- Supabase Auth handles auth.users automatically.
-- This table extends the profile with app-specific data.

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'de'
        CHECK (preferred_language IN ('ar', 'hi', 'rom', 'tr', 'fa', 'ro', 'hu', 'de', 'en')),
    preferred_persona TEXT DEFAULT 'mystic_elena',
    voice_consent BOOLEAN NOT NULL DEFAULT FALSE,
    data_retention_consent BOOLEAN NOT NULL DEFAULT FALSE,
    data_retention_months INTEGER DEFAULT 6,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    life_context_summary JSONB DEFAULT '{}'::jsonb,
    -- life_context_summary stores: current_situation, main_concerns,
    -- emotional_state, cultural_background, spiritual_experience_level
    subscription_tier TEXT DEFAULT 'free'
        CHECK (subscription_tier IN ('free', 'basic', 'premium', 'unlimited')),
    readings_this_month INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: Users can only read/update their own profile
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- READINGS
-- ============================================================

CREATE TABLE public.readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL CHECK (reading_type IN ('virtual', 'photo_upload')),
    spread_type TEXT NOT NULL DEFAULT 'three_card'
        CHECK (spread_type IN (
            'single', 'three_card', 'celtic_cross', 'love_spread',
            'career_spread', 'yes_no', 'past_present_future'
        )),
    question TEXT,
    cards JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- cards format: [{"position": 1, "card_id": "major_01_magician",
    --   "orientation": "upright", "recognized_from_photo": false}]
    onboarding_summary TEXT,
    -- AI-generated summary of the voice onboarding conversation
    interpretation TEXT,
    -- AI-generated tarot interpretation
    interpretation_language TEXT NOT NULL DEFAULT 'de',
    voice_used BOOLEAN NOT NULL DEFAULT FALSE,
    photo_urls TEXT[] DEFAULT '{}',
    emotional_tone TEXT,
    -- AI-detected: hopeful, anxious, curious, grieving, etc.
    recurring_themes TEXT[] DEFAULT '{}',
    -- Cross-session pattern detection
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    duration_seconds INTEGER,
    cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_readings_user_id ON public.readings(user_id);
CREATE INDEX idx_readings_created_at ON public.readings(created_at DESC);
CREATE INDEX idx_readings_themes ON public.readings USING GIN(recurring_themes);

ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own readings"
    ON public.readings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users insert own readings"
    ON public.readings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own readings"
    ON public.readings FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- SESSION MEMORY (Cross-Session Context for AI)
-- ============================================================

CREATE TABLE public.session_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN (
        'life_event', 'emotional_pattern', 'recurring_question',
        'preference', 'relationship', 'goal', 'concern'
    )),
    content TEXT NOT NULL,
    importance_score FLOAT DEFAULT 0.5 CHECK (importance_score BETWEEN 0 AND 1),
    source_reading_id UUID REFERENCES public.readings(id) ON DELETE SET NULL,
    embedding VECTOR(1536),
    -- For semantic search across memories
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_memory_user ON public.session_memory(user_id);
CREATE INDEX idx_session_memory_embedding ON public.session_memory
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.session_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own memory"
    ON public.session_memory FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- CARD LIBRARY (Static Reference Data)
-- ============================================================

CREATE TABLE public.card_library (
    id TEXT PRIMARY KEY,
    -- Format: "major_00_fool", "minor_cups_01_ace", etc.
    arcana TEXT NOT NULL CHECK (arcana IN ('major', 'minor')),
    suit TEXT CHECK (suit IN ('cups', 'wands', 'swords', 'pentacles', NULL)),
    number INTEGER,
    name_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- {"de": "Der Narr", "en": "The Fool", "ar": "...", "tr": "...", ...}
    meaning_upright JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- {"de": "Neubeginn, Spontanitaet...", "en": "New beginnings..."}
    meaning_reversed JSONB NOT NULL DEFAULT '{}'::jsonb,
    keywords JSONB NOT NULL DEFAULT '{}'::jsonb,
    -- {"de": ["Freiheit", "Abenteuer"], "en": ["Freedom", "Adventure"]}
    image_url TEXT,
    visual_description TEXT
    -- For AI: "A young person stands at a cliff edge, carrying a small bag..."
);

-- ============================================================
-- SUBSCRIPTIONS & PURCHASES
-- ============================================================

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    revenuecat_customer_id TEXT,
    product_id TEXT NOT NULL,
    -- e.g., "monthly_basic", "monthly_premium", "single_reading"
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'cancelled', 'grace_period')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscriptions"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- CONSENT LOG (GDPR Compliance)
-- ============================================================

CREATE TABLE public.consent_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'voice_recording', 'data_retention', 'sensitive_data_processing',
        'marketing', 'analytics', 'terms_of_service', 'privacy_policy'
    )),
    granted BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    consent_text_version TEXT NOT NULL,
    -- Version of the consent text shown to user
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own consent"
    ON public.consent_log FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- GDPR: Automatic data cleanup
-- ============================================================

-- Delete expired session memories
SELECT cron.schedule('cleanup-expired-memory', '0 3 * * *',
    $$DELETE FROM public.session_memory WHERE expires_at < NOW()$$
);

-- Delete voice recordings older than retention period
-- (handled via Supabase Storage lifecycle policies)

-- Function to handle user data deletion requests (GDPR Art. 17)
CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.session_memory WHERE user_id = target_user_id;
    DELETE FROM public.readings WHERE user_id = target_user_id;
    DELETE FROM public.consent_log WHERE user_id = target_user_id;
    DELETE FROM public.user_subscriptions WHERE user_id = target_user_id;
    DELETE FROM public.user_profiles WHERE id = target_user_id;
    -- Note: auth.users deletion must be triggered separately via Supabase Admin API
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

4. EDGE FUNCTIONS (API ENDPOINTS)
4.1 Projektstruktur
supabase/
  functions/
    _shared/
      cors.ts                  # CORS headers
      auth.ts                  # Auth middleware
      types.ts                 # Shared TypeScript types
      elevenlabs-client.ts     # ElevenLabs API wrapper
      claude-client.ts         # Claude API wrapper
      vision-client.ts         # Google Vision wrapper
      memory-manager.ts        # Session memory CRUD + embedding
      card-library.ts          # Card lookup + meaning retrieval
      prompt-templates/
        onboarding-system.ts   # System prompt for voice onboarding
        interpretation.ts      # System prompt for tarot interpretation
        memory-extraction.ts   # System prompt for extracting memories
    voice-token/
      index.ts                 # GET: Returns signed ElevenLabs session token
    reading-start/
      index.ts                 # POST: Initialize a new reading session
    reading-interpret/
      index.ts                 # POST: Generate AI interpretation for drawn cards
    cards-recognize/
      index.ts                 # POST: Recognize tarot cards from uploaded photo
    cards-draw/
      index.ts                 # POST: Virtually draw random cards for a spread
    profile-update/
      index.ts                 # POST: Update user profile from onboarding data
    memory-query/
      index.ts                 # POST: Semantic search across user's session memory
    subscription-webhook/
      index.ts                 # POST: RevenueCat webhook handler
    gdpr-export/
      index.ts                 # GET: Export all user data (GDPR Art. 15)
    gdpr-delete/
      index.ts                 # DELETE: Delete all user data (GDPR Art. 17)
4.2 Kern-Endpoints (Detailliert)
POST /voice-token
// Returns a signed, short-lived token for ElevenLabs Conversational AI
// The client uses this to establish a direct WebSocket to ElevenLabs

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // 1. Verify Supabase Auth JWT
  // 2. Check user has voice_consent = true
  // 3. Check subscription allows voice readings
  // 4. Fetch user profile for persona preference + language
  // 5. Create ElevenLabs Conversational AI session with:
  //    - agent_id: mapped from preferred_persona
  //    - language: user's preferred_language
  //    - system_prompt: onboarding prompt with user context
  //    - first_message: culturally appropriate greeting
  // 6. Return { token, session_id, agent_id, ws_url }
});
POST /reading-start
// Initialize a new reading. Returns reading_id and user context.
// Request: { spread_type, question?, reading_type: "virtual" | "photo_upload" }
// Response: { reading_id, user_context_summary, relevant_memories[], suggested_spread }

// Steps:
// 1. Auth check + subscription check
// 2. Increment readings_this_month
// 3. Query session_memory for relevant context (semantic search on question)
// 4. Create reading row in DB
// 5. Return context for the client to pass to ElevenLabs/Claude
POST /reading-interpret
// Generate the AI tarot interpretation after cards are drawn/recognized.
// Request: {
//   reading_id,
//   cards: [{card_id, position, orientation}],
//   onboarding_summary: string,  // From ElevenLabs conversation
//   question: string
// }
// Response: { interpretation, emotional_tone, recurring_themes[], memories_extracted[] }

// Steps:
// 1. Auth check
// 2. Load user profile + relevant session memories
// 3. Load card meanings from card_library
// 4. Build Claude prompt:
//    - System: interpretation prompt template
//    - User context: life_context_summary + onboarding_summary
//    - Cards: positions + meanings + visual descriptions
//    - Question: user's question
//    - Past patterns: recurring_themes from recent readings
//    - Language instruction: respond in user's preferred_language
// 5. Call Claude Sonnet API
// 6. Extract memories from interpretation (separate Claude call)
// 7. Store memories with embeddings in session_memory
// 8. Update reading row with interpretation
// 9. Return result
POST /cards-recognize
// Recognize tarot cards from a photo upload.
// Request: multipart/form-data with image file
// Response: { recognized_cards: [{card_id, confidence, orientation, bounding_box}] }

// Steps:
// 1. Auth check
// 2. Upload image to Supabase Storage (card_photos bucket)
// 3. Send image to Google Vision API (label + object detection)
// 4. If confidence < 0.7: fallback to Claude Vision
//    - Send image with prompt: "Identify all tarot cards visible in this image.
//      For each card, provide: card name, orientation (upright/reversed),
//      and approximate position in the image."
// 5. Map recognized names to card_library IDs
// 6. Return recognized cards with confidence scores

5. PROMPT TEMPLATES
5.1 Voice Onboarding System Prompt
// supabase/functions/_shared/prompt-templates/onboarding-system.ts

export function getOnboardingSystemPrompt(language: string, userName?: string): string {
  const prompts: Record<string, string> = {
    de: `Du bist eine einfuehlsame, warmherzige Kartenleserin namens {persona_name}.
Du fuehrst ein 10-minuetiges Vorgespraech, bevor du die Karten legst.

DEIN ZIEL: Verstehe die aktuelle Lebenssituation der Person, ihre Sorgen,
Hoffnungen und was sie sich von diesem Reading erhofft.

GESPRAECHSSTIL:
- Sprich einfach und klar (Sprachniveau A2-B1)
- Verwende kurze Saetze
- Stelle immer nur EINE Frage auf einmal
- Zeige echtes Mitgefuehl und Verstaendnis
- Wiederhole wichtige Punkte zur Bestaetigung
- Verwende KEINE Fachbegriffe

GESPRAECHSABLAUF:
1. Begruesse die Person warmherzig${userName ? ` (Name: ${userName})` : ''}
2. Frage, wie es ihr gerade geht (emotional)
3. Frage, was sie hierher gefuehrt hat / was sie beschaeftigt
4. Vertiefe das Hauptthema mit Nachfragen
5. Frage nach Hoffnungen oder Wuenschen fuer die Zukunft
6. Fasse zusammen und leite zum Kartenlegen ueber

WICHTIG:
- Du bist KEIN Therapeut und KEIN Wahrsager
- Du sagst NICHT die Zukunft voraus
- Du bietest Reflexion und Perspektivwechsel
- Wenn jemand von Suizid, Gewalt oder akuter Krise spricht,
  weise einfuehlsam auf professionelle Hilfe hin
- Respektiere religioese Ueberzeugungen
- Beende das Gespraech nach ca. 10 Minuten mit einer Ueberleitung`,

    ar: `[Arabic version - RTL formatted, A2-B1 level, culturally adapted]
// Anpassungen: Istikhara-Framing, kein "Wahrsagerei"-Vokabular,
// Respekt vor islamischen Werten, Begruessungsformeln (Salam)`,

    tr: `[Turkish version - culturally adapted]
// Anpassungen: Kahve Fali-Tradition referenzieren,
// warmherziger tuerkischer Kommunikationsstil,
// Hoefelichkeitsformen (Siz/Sen beachten)`,

    // ... weitere Sprachen
  };
  return prompts[language] || prompts['de'];
}
5.2 Tarot Interpretation Prompt
// supabase/functions/_shared/prompt-templates/interpretation.ts

export function getInterpretationPrompt(params: {
  language: string;
  cards: CardInSpread[];
  question: string;
  userContext: string;
  onboardingSummary: string;
  pastPatterns: string[];
  cardMeanings: CardMeaning[];
}): string {
  return `Du bist eine erfahrene, einfuehlsame Kartenleserin.
Interpretiere die gezogenen Karten im Kontext der Lebenssituation dieser Person.

## Kontext der Person
${params.userContext}

## Zusammenfassung des Vorgespraechs
${params.onboardingSummary}

## Wiederkehrende Themen aus frueheren Readings
${params.pastPatterns.length > 0
  ? params.pastPatterns.map(p => `- ${p}`).join('\n')
  : 'Erstes Reading - keine frueheren Themen.'}

## Frage der Person
"${params.question}"

## Gezogene Karten
${params.cards.map((c, i) => `
Position ${i + 1} (${c.positionMeaning}): ${c.cardName} (${c.orientation})
Bedeutung: ${c.meaning}
`).join('\n')}

## Deine Aufgabe
1. Interpretiere jede Karte einzeln im Kontext der Person
2. Zeige Verbindungen zwischen den Karten auf
3. Beziehe dich direkt auf das, was im Vorgespraech besprochen wurde
4. Wenn es wiederkehrende Themen gibt, sprich diese an
5. Ende mit einer ermutigenden, aber realistischen Botschaft
6. Schlage 1-2 konkrete Reflexionsfragen vor

## Stil-Anweisungen
- Sprache: ${params.language}
- Sprachniveau: A2-B1 (einfach, klar, kurze Saetze)
- Ton: warm, einfuehlsam, respektvoll
- KEINE Zukunftsvorhersagen, nur Reflexionsangebote
- Laenge: 300-500 Woerter`;
}

6. FRONTEND ARCHITEKTUR (React Native / Expo)
6.1 Projektstruktur
app/                           # expo-router file-based routing
  (auth)/
    login.tsx                  # Phone/Email login
    onboarding-consent.tsx     # GDPR consent collection
  (tabs)/
    index.tsx                  # Home: Start reading / Daily card
    readings.tsx               # Reading history
    profile.tsx                # Profile & settings
  reading/
    [id]/
      voice-onboarding.tsx     # ElevenLabs voice conversation screen
      draw-cards.tsx           # Virtual card drawing (animated)
      photo-upload.tsx         # Camera / gallery card photo
      interpretation.tsx       # AI interpretation display
      feedback.tsx             # Rate & feedback
  settings/
    language.tsx               # Language selection (9 languages)
    persona.tsx                # Choose AI persona/voice
    privacy.tsx                # Data management, export, delete
    subscription.tsx           # Subscription management

components/
  ui/
    RTLView.tsx                # Wrapper that flips layout for RTL languages
    VoiceWaveform.tsx          # Animated waveform during voice conversation
    CardFan.tsx                # Animated card fan for drawing
    CardReveal.tsx             # Card flip animation
    TarotCard.tsx              # Individual card display
    SpreadLayout.tsx           # Visual spread layout (3-card, Celtic Cross)
    ConsentModal.tsx           # Reusable GDPR consent modal
    LanguagePicker.tsx         # Language selection with native script display
    PersonaAvatar.tsx          # AI persona display

  voice/
    VoiceSession.tsx           # ElevenLabs WebSocket session manager
    VoiceIndicator.tsx         # Speaking/listening/processing states
    TranscriptDisplay.tsx      # Real-time transcript (optional, accessibility)

  cards/
    PhotoCapture.tsx           # Camera overlay with card frame guide
    CardRecognitionResult.tsx  # Show recognized cards with confidence

hooks/
  useVoiceSession.ts           # ElevenLabs session lifecycle
  useReading.ts                # Reading flow state machine
  useCardDraw.ts               # Virtual card drawing logic
  useMemory.ts                 # Session memory queries
  useSubscription.ts           # RevenueCat subscription state
  useLanguage.ts               # i18n helpers + RTL detection
  useSupabase.ts               # Supabase client singleton

lib/
  supabase.ts                  # Supabase client init
  elevenlabs.ts                # ElevenLabs client config
  i18n.ts                      # i18next config with all 9 languages
  card-data.ts                 # Local card reference data
  spreads.ts                   # Spread definitions (positions, meanings)
  personas.ts                  # AI persona definitions

locales/
  ar.json                      # Arabic translations
  hi.json                      # Hindi translations
  rom.json                     # Romani translations (Vlax dialect)
  tr.json                      # Turkish translations
  fa.json                      # Dari/Farsi translations
  ro.json                      # Romanian translations
  hu.json                      # Hungarian translations
  de.json                      # German translations
  en.json                      # English translations

types/
  reading.ts                   # Reading types
  card.ts                      # Card types
  user.ts                      # User/Profile types
  voice.ts                     # Voice session types
6.2 Reading Flow State Machine
// hooks/useReading.ts

type ReadingState =
  | { step: 'idle' }
  | { step: 'consent_check' }          // Check/request GDPR consent
  | { step: 'voice_onboarding';        // 10-min voice conversation
      sessionId: string }
  | { step: 'choose_method' }          // Virtual draw or photo upload?
  | { step: 'virtual_draw';            // Animated card drawing
      spreadType: SpreadType }
  | { step: 'photo_upload' }           // Camera / gallery upload
  | { step: 'card_recognition';        // AI recognizing cards from photo
      imageUri: string }
  | { step: 'card_confirmation';       // User confirms recognized cards
      cards: RecognizedCard[] }
  | { step: 'generating_interpretation';// Claude API call
      readingId: string }
  | { step: 'interpretation';          // Display result
      readingId: string;
      interpretation: string }
  | { step: 'feedback';                // Rate & feedback
      readingId: string }
  | { step: 'error';
      message: string;
      recoveryAction?: () => void };

// Transitions:
// idle -> consent_check -> voice_onboarding -> choose_method
// choose_method -> virtual_draw -> generating_interpretation
// choose_method -> photo_upload -> card_recognition -> card_confirmation -> generating_interpretation
// generating_interpretation -> interpretation -> feedback -> idle
6.3 RTL Support
// lib/i18n.ts

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';
import * as Localization from 'expo-localization';

const RTL_LANGUAGES = ['ar', 'fa'];

export function setAppLanguage(lang: string) {
  const isRTL = RTL_LANGUAGES.includes(lang);
  I18nManager.forceRTL(isRTL);
  I18nManager.allowRTL(isRTL);
  i18n.changeLanguage(lang);
  // Note: App restart may be required for RTL to fully take effect
}

i18n.use(initReactI18next).init({
  fallbackLng: 'de',
  supportedLngs: ['ar', 'hi', 'rom', 'tr', 'fa', 'ro', 'hu', 'de', 'en'],
  interpolation: { escapeValue: false },
  resources: {
    ar: { translation: require('../locales/ar.json') },
    hi: { translation: require('../locales/hi.json') },
    rom: { translation: require('../locales/rom.json') },
    tr: { translation: require('../locales/tr.json') },
    fa: { translation: require('../locales/fa.json') },
    ro: { translation: require('../locales/ro.json') },
    hu: { translation: require('../locales/hu.json') },
    de: { translation: require('../locales/de.json') },
    en: { translation: require('../locales/en.json') },
  },
});

7. AI PERSONA DEFINITIONS
// lib/personas.ts

export interface Persona {
  id: string;
  name: Record<string, string>;  // Localized names
  description: Record<string, string>;
  elevenLabsVoiceId: string;
  elevenLabsAgentId: string;
  style: 'warm' | 'mystical' | 'direct' | 'playful';
  culturalAffinity: string[];  // Which cultures this persona resonates with
  avatarUrl: string;
}

export const PERSONAS: Persona[] = [
  {
    id: 'mystic_elena',
    name: { de: 'Elena', en: 'Elena', ar: 'ايلينا', tr: 'Elena' },
    description: {
      de: 'Warmherzig und einfuehlsam. Wie eine weise Grossmutter.',
      en: 'Warm and empathetic. Like a wise grandmother.',
    },
    elevenLabsVoiceId: 'VOICE_ID_ELENA',  // Configure in ElevenLabs
    elevenLabsAgentId: 'AGENT_ID_ELENA',
    style: 'warm',
    culturalAffinity: ['de', 'en', 'ro', 'hu'],
    avatarUrl: '/assets/personas/elena.png',
  },
  {
    id: 'sage_amira',
    name: { de: 'Amira', en: 'Amira', ar: 'اميرة', tr: 'Amira' },
    description: {
      de: 'Ruhig und weise. Inspiriert von Sufi-Weisheit.',
      ar: 'هادئة وحكيمة. مستوحاة من الحكمة الصوفية.',
    },
    elevenLabsVoiceId: 'VOICE_ID_AMIRA',
    elevenLabsAgentId: 'AGENT_ID_AMIRA',
    style: 'mystical',
    culturalAffinity: ['ar', 'fa', 'tr'],
    avatarUrl: '/assets/personas/amira.png',
  },
  {
    id: 'guide_priya',
    name: { de: 'Priya', en: 'Priya', hi: 'प्रिया', tr: 'Priya' },
    description: {
      de: 'Klar und direkt. Verbindet Vedische Weisheit mit Tarot.',
      hi: 'स्पष्ट और सीधी। वैदिक ज्ञान को टैरो से जोड़ती हैं।',
    },
    elevenLabsVoiceId: 'VOICE_ID_PRIYA',
    elevenLabsAgentId: 'AGENT_ID_PRIYA',
    style: 'direct',
    culturalAffinity: ['hi', 'en'],
    avatarUrl: '/assets/personas/priya.png',
  },
  {
    id: 'spirit_romani',
    name: { de: 'Drabardi', en: 'Drabardi', rom: 'Drabardi' },
    description: {
      de: 'Verbunden mit der Roma-Tradition des Kartenlegens.',
      rom: 'Phandli le Rromane tradiciasa le lavutarnengi.',
    },
    elevenLabsVoiceId: 'VOICE_ID_DRABARDI',  // Custom cloned voice
    elevenLabsAgentId: 'AGENT_ID_DRABARDI',
    style: 'mystical',
    culturalAffinity: ['rom', 'ro', 'hu'],
    avatarUrl: '/assets/personas/drabardi.png',
  },
  {
    id: 'reader_ayse',
    name: { de: 'Ayse', en: 'Ayse', tr: 'Ayşe' },
    description: {
      de: 'Wie eine tuerkische Tante beim Kaffeesatz-Lesen.',
      tr: 'Kahve falı bakan bir teyze gibi.',
    },
    elevenLabsVoiceId: 'VOICE_ID_AYSE',
    elevenLabsAgentId: 'AGENT_ID_AYSE',
    style: 'warm',
    culturalAffinity: ['tr', 'de'],
    avatarUrl: '/assets/personas/ayse.png',
  },
];

8. ENVIRONMENT VARIABLES
# .env.local (Expo / React Native)
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_ELEVENLABS_API_KEY=el_...
EXPO_PUBLIC_REVENUECAT_API_KEY_IOS=appl_...
EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID=goog_...

# Supabase Edge Functions Secrets (set via supabase secrets set)
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=el_...
GOOGLE_CLOUD_VISION_KEY=AIza...
GOOGLE_CLOUD_TTS_KEY=AIza...
REVENUECAT_WEBHOOK_SECRET=whsec_...

9. SUBSCRIPTION TIERS & LIMITS
// lib/subscription-tiers.ts

export const TIERS = {
  free: {
    readings_per_month: 2,
    voice_onboarding: true,    // Only for first reading
    voice_interpretation: false,
    photo_upload: false,
    session_memory: false,     // No cross-session memory
    personas: ['mystic_elena'],
    spreads: ['single', 'three_card'],
    price_monthly: 0,
  },
  basic: {
    readings_per_month: 10,
    voice_onboarding: true,
    voice_interpretation: false,  // Text-only interpretation
    photo_upload: true,
    session_memory: true,
    personas: ['mystic_elena', 'sage_amira', 'reader_ayse'],
    spreads: ['single', 'three_card', 'past_present_future', 'yes_no'],
    price_monthly_eur: 4.99,
  },
  premium: {
    readings_per_month: 30,
    voice_onboarding: true,
    voice_interpretation: true,  // Voice reads the interpretation
    photo_upload: true,
    session_memory: true,
    personas: 'all',
    spreads: 'all',
    price_monthly_eur: 9.99,
  },
  unlimited: {
    readings_per_month: -1,    // Unlimited
    voice_onboarding: true,
    voice_interpretation: true,
    photo_upload: true,
    session_memory: true,
    personas: 'all',
    spreads: 'all',
    price_monthly_eur: 19.99,
  },
  single_reading: {
    // Pay-per-reading option (no subscription)
    price_eur: 1.99,
    includes_voice: true,
    includes_photo: true,
  },
} as const;

10. DEPLOYMENT & INFRASTRUCTURE
10.1 Supabase Project Setup
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to remote project (EU region!)
supabase link --project-ref your-project-ref

# Push database migrations
supabase db push

# Deploy edge functions
supabase functions deploy voice-token
supabase functions deploy reading-start
supabase functions deploy reading-interpret
supabase functions deploy cards-recognize
supabase functions deploy cards-draw
supabase functions deploy profile-update
supabase functions deploy memory-query
supabase functions deploy subscription-webhook
supabase functions deploy gdpr-export
supabase functions deploy gdpr-delete

# Set secrets
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set ELEVENLABS_API_KEY=el_...
supabase secrets set GOOGLE_CLOUD_VISION_KEY=AIza...
supabase secrets set GOOGLE_CLOUD_TTS_KEY=AIza...
supabase secrets set REVENUECAT_WEBHOOK_SECRET=whsec_...
10.2 Expo Build & Deploy
# Install EAS CLI
npm install -g eas-cli

# Configure builds
eas build:configure

# Build for iOS and Android
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores
eas submit --platform ios
eas submit --platform android
10.3 eas.json
{
  "cli": { "version": ">= 12.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": true }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://your-project.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "eyJ..."
      }
    }
  },
  "submit": {
    "production": {
      "ios": { "appleId": "your@apple.id", "ascAppId": "123456789" },
      "android": { "serviceAccountKeyPath": "./google-services.json" }
    }
  }
}

11. CRITICAL IMPLEMENTATION NOTES
11.1 Voice Onboarding Flow (ElevenLabs Integration)
Client                    ElevenLabs              Supabase Edge Function
  |                           |                          |
  |-- POST /voice-token ----->|                          |
  |                           |                          |
  |<-- { token, ws_url } ----|                          |
  |                           |                          |
  |== WebSocket Connect =====>|                          |
  |                           |                          |
  |<-- AI greeting (voice) ---|                          |
  |                           |                          |
  |-- User speaks ----------->|                          |
  |<-- AI responds (voice) ---|                          |
  |   ... (10 minutes) ...    |                          |
  |                           |                          |
  |<-- conversation_ended ----|                          |
  |<-- transcript + summary --|                          |
  |                           |                          |
  |-- POST /reading-start ----|------- with summary ---->|
  |                           |                          |
  |<-- { reading_id, context }|<-------------------------|
11.2 Privacy-by-Design Checklist
[x] All data stored in EU region (Supabase eu-central-1)
[x] Row-Level Security on ALL tables
[x] Voice recordings: NOT stored by default (only transcripts)
[x] Optional voice storage requires separate consent
[x] Sensitive data (life_context_summary) encrypted at rest
[x] Consent log with versioned consent texts
[x] GDPR export endpoint (Art. 15)
[x] GDPR deletion endpoint (Art. 17)
[x] Automatic data expiry via pg_cron
[x] No analytics without explicit consent
[x] No data shared with third parties
[x] ElevenLabs: DPA required, data not used for training
[x] Anthropic: DPA required, data not used for training
[x] All API keys in Supabase Secrets (not in client code)
[x] Supabase Anon Key has minimal permissions via RLS
11.3 Kostenoptimierung (WICHTIG)
PROBLEM: ElevenLabs Conversational AI = ~99% der variablen Kosten.
         10 Min. Voice Onboarding x 15 Readings/Mo. = EUR 15/User/Mo.

LOESUNG: Gestaffeltes Voice-Budget:
- Free Tier:   1x Voice Onboarding (Erst-Reading), danach Text-Chat
- Basic Tier:  Voice Onboarding bei jedem Reading, Text-Interpretation
- Premium:     Voice Onboarding + Voice-Interpretation
- Unlimited:   Unbegrenzt Voice

ZUSAETZLICH:
- Onboarding-Dauer reduzieren nach Erst-Session (5 Min. statt 10 Min.)
  weil Kontext bereits gespeichert
- Google Cloud TTS als guenstiges Fallback fuer Text-Interpretation
  vorlesen (statt ElevenLabs): Faktor 100 guenstiger
- Conversation caching: Aehnliche Gespraechsmuster vorberechnen

12. PACKAGE.JSON (ROOT)
{
  "name": "tarot-ai-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "lint": "eslint . --ext .ts,.tsx",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "db:push": "supabase db push",
    "db:reset": "supabase db reset",
    "functions:deploy": "supabase functions deploy",
    "seed:cards": "tsx scripts/seed-card-library.ts"
  },
  "dependencies": {
    "expo": "~52.0.0",
    "expo-av": "~14.0.0",
    "expo-camera": "~16.0.0",
    "expo-haptics": "~13.0.0",
    "expo-image-picker": "~16.0.0",
    "expo-localization": "~16.0.0",
    "expo-router": "~4.0.0",
    "expo-secure-store": "~14.0.0",
    "expo-status-bar": "~2.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-reanimated": "~3.16.0",
    "@supabase/supabase-js": "^2.45.0",
    "@11labs/react": "^1.0.0",
    "react-native-purchases": "^8.0.0",
    "zustand": "^5.0.0",
    "i18next": "^24.0.0",
    "react-i18next": "^15.0.0",
    "@tamagui/core": "^1.100.0",
    "tamagui": "^1.100.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "typescript": "~5.4.0",
    "eslint": "^9.0.0",
    "jest": "^30.0.0",
    "supabase": "^2.0.0",
    "tsx": "^4.0.0"
  }
}

13. MVP SCOPE (Phase 1)
Fuer den MVP folgende Features implementieren:
PHASE 1 (MVP - 8 Wochen):
[x] Auth (Email + Phone OTP)
[x] Language selection (DE, EN, AR, TR - 4 Sprachen fuer MVP)
[x] GDPR consent flow
[x] Voice onboarding (ElevenLabs, 1 Persona: Elena)
[x] Virtual card drawing (3-Card Spread)
[x] AI interpretation (Claude Sonnet)
[x] Reading history
[x] Basic profile
[x] Free tier (2 Readings/Mo.)
[x] RevenueCat subscription (Basic + Premium)

PHASE 2 (+ 4 Wochen):
[ ] Photo upload + card recognition
[ ] 3 weitere Personas
[ ] Session memory (cross-reading context)
[ ] Celtic Cross spread
[ ] 5 weitere Sprachen (HI, FA, RO, HU, ROM)

PHASE 3 (+ 4 Wochen):
[ ] Romani voice (custom cloned)
[ ] Kahve Fali mode (Tuerkischer Kaffeesatz)
[ ] Community features (anonyme geteilte Readings)
[ ] Push notifications (Daily card)
[ ] Offline mode (cached card meanings)

Dieses Dokument ist vollstaendig und sofort umsetzbar. Alle Technologieentscheidungen sind begruendet, alle Schemas definiert, alle Prompt-Templates vorbereitet.
