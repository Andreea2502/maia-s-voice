import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { createConversationalAISession } from '../_shared/elevenlabs-client.ts';
import {
  getMasterOnboardingSystemPrompt,
  getMasterFirstMessage,
  getTarotOnboardingSystemPrompt,
  getTarotFirstMessage,
  getCompanionSystemPrompt,
  getCompanionFirstMessage,
} from '../_shared/prompt-templates/onboarding-system.ts';
import { PersonaId, SupportedLanguage, ModuleId } from '../_shared/types.ts';

// Request body:
// {
//   module: ModuleId           — which module is requesting a session
//   personaId?: PersonaId      — only relevant for tarot
// }

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const module: ModuleId = body.module ?? 'tarot';
    const personaId: PersonaId | undefined = body.personaId;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('preferred_persona, preferred_language, voice_consent, subscription_tier, display_name')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // voice_consent check is done per-module below (companion bypasses it)

    const language = profile.preferred_language as SupportedLanguage;
    const displayName = profile.display_name ?? undefined;

    // Choose system prompt + first message based on module
    let systemPrompt: string;
    let firstMessage: string;

    if (module === 'companion') {
      // Load rich context for companion mode
      const { data: fullProfile } = await supabase
        .from('user_profiles')
        .select('personal_profile, birth_date')
        .eq('id', userId)
        .single();

      // Get last reading for context
      const { data: lastReadings } = await supabase
        .from('readings')
        .select('module, reading_type, created_at, interpretation')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastR = lastReadings?.[0];
      const pp = fullProfile?.personal_profile as Record<string, string> | null;

      // Build life context from personal_profile
      const ctxParts: string[] = [];
      if (pp?.lifeFocus)     ctxParts.push(`Beschäftigt sich mit: ${pp.lifeFocus}`);
      if (pp?.relationshipStatus) ctxParts.push(`Beziehungsstatus: ${pp.relationshipStatus}`);
      if (pp?.characterDesc) ctxParts.push(`Selbstbild: ${pp.characterDesc}`);
      if (pp?.openQuestion)  ctxParts.push(`Offene Frage: ${pp.openQuestion}`);

      // Sun sign from birth date
      let sunSign: string | undefined;
      if (fullProfile?.birth_date) {
        const [, m, d] = (fullProfile.birth_date as string).split('-').map(Number);
        const SIGNS = ['Steinbock','Wassermann','Fische','Widder','Stier','Zwillinge','Krebs','Löwe','Jungfrau','Waage','Skorpion','Schütze'];
        const CUSPS = [20,19,20,20,21,21,23,23,23,23,22,22];
        const idx = d < CUSPS[m-1] ? (m - 2 + 12) % 12 : (m - 1) % 12;
        sunSign = SIGNS[idx];
      }

      // Brief last-reading summary (first 200 chars of interpretation)
      const summary = lastR?.interpretation
        ? String(lastR.interpretation).replace(/##[^\n]*/g, '').trim().slice(0, 200)
        : undefined;

      systemPrompt = getCompanionSystemPrompt(language, {
        userName: pp?.displayName ?? displayName,
        sunSign,
        lifeContext: ctxParts.length > 0 ? ctxParts.join('\n') : undefined,
        lastReadingModule: lastR ? (lastR.module === 'tarot' ? 'Tarot' : 'Horoskop') : undefined,
        lastReadingDate: lastR?.created_at
          ? new Date(lastR.created_at).toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })
          : undefined,
        lastReadingSummary: summary,
      });
      firstMessage = getCompanionFirstMessage(language, pp?.displayName ?? displayName);

    } else if (module === 'tarot' && personaId) {
      if (!profile.voice_consent) {
        return new Response(JSON.stringify({ error: 'Voice consent required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      systemPrompt = getTarotOnboardingSystemPrompt(language, personaId, displayName);
      firstMessage = getTarotFirstMessage(language, personaId, displayName);
    } else {
      if (!profile.voice_consent) {
        return new Response(JSON.stringify({ error: 'Voice consent required' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Überstimme for onboarding
      systemPrompt = getMasterOnboardingSystemPrompt(language, displayName);
      firstMessage = getMasterFirstMessage(language, displayName);
    }

    const session = await createConversationalAISession({
      module,
      personaId,
      language,
      systemPromptOverride: systemPrompt,
      firstMessage,
    });

    return new Response(JSON.stringify(session), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[voice-token] ERROR:', message);
    const status = message === 'Unauthorized' ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
