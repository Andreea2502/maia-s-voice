-- ============================================================
-- Mystic App – Multi-Module Migration
-- Generalises readings table, updates persona names,
-- adds astrology birth data storage
-- ============================================================

-- 1. Update persona check in user_profiles
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_preferred_persona_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_preferred_persona_check
  CHECK (preferred_persona IN ('luna','zara','maya') OR preferred_persona IS NULL);

-- Migrate old persona IDs to new names
UPDATE public.user_profiles
  SET preferred_persona = CASE preferred_persona
    WHEN 'mystic_elena' THEN 'luna'
    WHEN 'sage_amira'   THEN 'zara'
    WHEN 'guide_priya'  THEN 'maya'
    ELSE preferred_persona
  END
WHERE preferred_persona IN ('mystic_elena','sage_amira','guide_priya');

-- 2. Update readings table for multi-module

-- Add module column
ALTER TABLE public.readings
  ADD COLUMN IF NOT EXISTS module TEXT NOT NULL DEFAULT 'tarot'
  CHECK (module IN ('tarot','astrology','numerology','coffee','palm'));

-- Add persona column (was implicit in reading_type)
ALTER TABLE public.readings
  ADD COLUMN IF NOT EXISTS persona TEXT
  CHECK (persona IN ('luna','zara','maya') OR persona IS NULL);

-- Make spread_type nullable (only relevant for tarot)
ALTER TABLE public.readings
  ALTER COLUMN spread_type DROP NOT NULL,
  ALTER COLUMN spread_type DROP DEFAULT;

ALTER TABLE public.readings
  DROP CONSTRAINT IF EXISTS readings_spread_type_check;

ALTER TABLE public.readings
  ADD CONSTRAINT readings_spread_type_check
  CHECK (spread_type IN (
    'single','three_card','celtic_cross','love_spread',
    'career_spread','yes_no','past_present_future'
  ) OR spread_type IS NULL);

-- Make cards nullable (not relevant for astrology/coffee/palm)
ALTER TABLE public.readings
  ALTER COLUMN cards DROP NOT NULL;

-- Add astrology_chart JSONB for storing chart data
ALTER TABLE public.readings
  ADD COLUMN IF NOT EXISTS astrology_chart JSONB;

-- Add media_upload_url for coffee/palm vision modules
ALTER TABLE public.readings
  ADD COLUMN IF NOT EXISTS media_upload_url TEXT;

-- Add saved_by_user flag
ALTER TABLE public.readings
  ADD COLUMN IF NOT EXISTS saved_by_user BOOLEAN NOT NULL DEFAULT FALSE;

-- Update reading_type check to include astrology types
ALTER TABLE public.readings
  DROP CONSTRAINT IF EXISTS readings_reading_type_check;

ALTER TABLE public.readings
  ADD CONSTRAINT readings_reading_type_check
  CHECK (reading_type IN (
    'virtual','photo_upload',
    'natal_chart','transit','synastry',
    'numerology_life_path','coffee_grounds','palm_lines'
  ));

-- 3. Birth data table for astrology
CREATE TABLE IF NOT EXISTS public.birth_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_time_known BOOLEAN NOT NULL DEFAULT FALSE,
  birth_city TEXT NOT NULL,
  birth_country TEXT NOT NULL,
  birth_lat DOUBLE PRECISION,
  birth_lng DOUBLE PRECISION,
  birth_timezone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.birth_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own birth data"   ON public.birth_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own birth data" ON public.birth_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own birth data" ON public.birth_data FOR UPDATE USING (auth.uid() = user_id);

-- 4. Add module index
CREATE INDEX IF NOT EXISTS idx_readings_module ON public.readings(module);

-- 5. Update monthly reading reset to count by module
-- (existing cron job still works – it resets the aggregate counter)

-- 6. Add input_mode column to user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS input_mode TEXT NOT NULL DEFAULT 'text'
  CHECK (input_mode IN ('voice','text'));
