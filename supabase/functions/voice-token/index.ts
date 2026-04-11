import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { createConversationalAISession } from '../_shared/elevenlabs-client.ts';
import { getOnboardingSystemPrompt, getOnboardingFirstMessage } from '../_shared/prompt-templates/onboarding-system.ts';
import { PersonaId, SupportedLanguage } from '../_shared/types.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);

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

    if (!profile.voice_consent) {
      return new Response(JSON.stringify({ error: 'Voice consent required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const persona = profile.preferred_persona as PersonaId;
    const language = profile.preferred_language as SupportedLanguage;

    const systemPrompt = getOnboardingSystemPrompt(language, persona, profile.display_name ?? undefined);
    const firstMessage = getOnboardingFirstMessage(language, persona, profile.display_name ?? undefined);

    const session = await createConversationalAISession({
      personaId: persona,
      language,
      systemPromptOverride: systemPrompt,
      firstMessage,
    });

    return new Response(JSON.stringify(session), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    const status = message === 'Unauthorized' ? 401 : 500;
    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
