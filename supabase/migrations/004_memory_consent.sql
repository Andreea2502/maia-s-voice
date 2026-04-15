-- ============================================================
-- Mystic App – Memory Consent & Safety Migration
-- Adds user-controlled session memory preference
-- ============================================================

-- 1. Memory consent flag on user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS memory_enabled BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Memory consent timestamp (when user made the choice)
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS memory_consent_at TIMESTAMPTZ;

-- 3. Session memory table — stores context per reading session
--    Only written when memory_enabled = true
CREATE TABLE IF NOT EXISTS public.session_memories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  memory_type  TEXT NOT NULL CHECK (memory_type IN (
                 'life_event', 'emotional_pattern', 'recurring_question',
                 'preference', 'relationship', 'goal', 'concern'
               )),
  content      TEXT NOT NULL,
  importance   FLOAT NOT NULL DEFAULT 0.5 CHECK (importance >= 0 AND importance <= 1),
  source       TEXT NOT NULL CHECK (source IN ('tarot', 'astrology', 'onboarding', 'numerology', 'palm', 'coffee')),
  reading_id   UUID REFERENCES public.readings(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.session_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own memories"   ON public.session_memories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own memories" ON public.session_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own memories" ON public.session_memories FOR DELETE USING (auth.uid() = user_id);

-- 4. Function: delete all memories for a user (called when memory disabled)
CREATE OR REPLACE FUNCTION public.clear_user_memories(p_user_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.session_memories WHERE user_id = p_user_id;
$$;

-- 5. Index for fast retrieval
CREATE INDEX IF NOT EXISTS idx_session_memories_user ON public.session_memories(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_session_memories_importance ON public.session_memories(user_id, importance DESC);
