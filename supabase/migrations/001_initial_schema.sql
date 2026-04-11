-- ============================================================
-- Tarot App – Initial Schema
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & PROFILES
-- ============================================================
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'de'
        CHECK (preferred_language IN ('ar','hi','rom','tr','fa','ro','hu','de','en')),
    preferred_persona TEXT DEFAULT 'mystic_elena'
        CHECK (preferred_persona IN ('mystic_elena','sage_amira','guide_priya')),
    voice_consent BOOLEAN NOT NULL DEFAULT FALSE,
    data_retention_consent BOOLEAN NOT NULL DEFAULT FALSE,
    data_retention_months INTEGER DEFAULT 6,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    life_context_summary JSONB DEFAULT '{}'::jsonb,
    subscription_tier TEXT DEFAULT 'free'
        CHECK (subscription_tier IN ('free','basic','premium','unlimited')),
    readings_this_month INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile"    ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"  ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users insert own profile"  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, preferred_language)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'de'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- READINGS
-- ============================================================
CREATE TABLE public.readings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    reading_type TEXT NOT NULL CHECK (reading_type IN ('virtual','photo_upload')),
    spread_type TEXT NOT NULL DEFAULT 'three_card'
        CHECK (spread_type IN (
            'single','three_card','celtic_cross','love_spread',
            'career_spread','yes_no','past_present_future'
        )),
    question TEXT,
    cards JSONB NOT NULL DEFAULT '[]'::jsonb,
    onboarding_summary TEXT,
    interpretation TEXT,
    interpretation_language TEXT NOT NULL DEFAULT 'de',
    voice_used BOOLEAN NOT NULL DEFAULT FALSE,
    input_mode TEXT NOT NULL DEFAULT 'voice' CHECK (input_mode IN ('voice','text')),
    photo_urls TEXT[] DEFAULT '{}',
    emotional_tone TEXT,
    recurring_themes TEXT[] DEFAULT '{}',
    user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback TEXT,
    duration_seconds INTEGER,
    cost_cents INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_readings_user_id    ON public.readings(user_id);
CREATE INDEX idx_readings_created_at ON public.readings(created_at DESC);
CREATE INDEX idx_readings_themes     ON public.readings USING GIN(recurring_themes);

ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own readings"   ON public.readings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own readings" ON public.readings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own readings" ON public.readings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- SESSION MEMORY
-- ============================================================
CREATE TABLE public.session_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN (
        'life_event','emotional_pattern','recurring_question',
        'preference','relationship','goal','concern'
    )),
    content TEXT NOT NULL,
    importance_score FLOAT DEFAULT 0.5 CHECK (importance_score BETWEEN 0 AND 1),
    source_reading_id UUID REFERENCES public.readings(id) ON DELETE SET NULL,
    embedding VECTOR(1536),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_session_memory_user      ON public.session_memory(user_id);
CREATE INDEX idx_session_memory_embedding ON public.session_memory
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

ALTER TABLE public.session_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own memory" ON public.session_memory FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- CARD LIBRARY
-- ============================================================
CREATE TABLE public.card_library (
    id TEXT PRIMARY KEY,
    arcana TEXT NOT NULL CHECK (arcana IN ('major','minor')),
    suit TEXT CHECK (suit IN ('cups','wands','swords','pentacles',NULL)),
    number INTEGER,
    name_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
    meaning_upright JSONB NOT NULL DEFAULT '{}'::jsonb,
    meaning_reversed JSONB NOT NULL DEFAULT '{}'::jsonb,
    keywords JSONB NOT NULL DEFAULT '{}'::jsonb,
    image_url TEXT,
    visual_description TEXT
);

-- Card library is public read
ALTER TABLE public.card_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Card library is public" ON public.card_library FOR SELECT USING (TRUE);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    revenuecat_customer_id TEXT,
    product_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','expired','cancelled','grace_period')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own subscriptions" ON public.user_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- CONSENT LOG (GDPR)
-- ============================================================
CREATE TABLE public.consent_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN (
        'voice_recording','data_retention','sensitive_data_processing',
        'marketing','analytics','terms_of_service','privacy_policy'
    )),
    granted BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    consent_text_version TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.consent_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own consent" ON public.consent_log FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- GDPR: Automatic cleanup
-- ============================================================
SELECT cron.schedule(
    'cleanup-expired-memory',
    '0 3 * * *',
    $$DELETE FROM public.session_memory WHERE expires_at < NOW()$$
);

SELECT cron.schedule(
    'reset-monthly-readings',
    '0 0 1 * *',
    $$UPDATE public.user_profiles SET readings_this_month = 0$$
);

-- ============================================================
-- GDPR: User data deletion (Art. 17)
-- ============================================================
CREATE OR REPLACE FUNCTION public.delete_user_data(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.session_memory     WHERE user_id = target_user_id;
    DELETE FROM public.readings           WHERE user_id = target_user_id;
    DELETE FROM public.consent_log        WHERE user_id = target_user_id;
    DELETE FROM public.user_subscriptions WHERE user_id = target_user_id;
    DELETE FROM public.user_profiles      WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Helper: match memories by embedding similarity
-- ============================================================
CREATE OR REPLACE FUNCTION public.match_memories(
    query_embedding VECTOR(1536),
    match_user_id UUID,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    memory_type TEXT,
    importance_score FLOAT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sm.id,
        sm.content,
        sm.memory_type,
        sm.importance_score,
        1 - (sm.embedding <=> query_embedding) AS similarity
    FROM public.session_memory sm
    WHERE sm.user_id = match_user_id
      AND sm.expires_at IS NULL OR sm.expires_at > NOW()
    ORDER BY sm.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
