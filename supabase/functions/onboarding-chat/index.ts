import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getOptionalUser } from '../_shared/auth.ts';
import { generateText } from '../_shared/gemini-client.ts';
import { getMasterOnboardingSystemPrompt } from '../_shared/prompt-templates/onboarding-system.ts';
import { detectCrisisSignals, getCrisisResponse } from '../_shared/prompt-templates/interpretation.ts';
import { SupportedLanguage } from '../_shared/types.ts';

// Text-mode onboarding — one message at a time
// Body: { message: string, history: [{role, content}], personaId?, context?, profileSummary? }
// Returns: { reply: string, history: [{role, content}], crisis?: boolean }

const PERSONA_NAMES: Record<string, string> = {
  luna: 'Luna',
  maya: 'Maya',
  zara: 'Zara',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getOptionalUser(req);
    const { message, history = [], personaId, context, profileSummary } = await req.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Empty message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let language: SupportedLanguage = 'de';
    let displayName: string | undefined;

    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('preferred_language, display_name')
        .eq('id', userId)
        .single();
      language = (profile?.preferred_language ?? 'de') as SupportedLanguage;
      displayName = profile?.display_name ?? undefined;
    }

    // ── Crisis check — always before generating a reply ──────────────
    if (detectCrisisSignals(message)) {
      const crisisReply = getCrisisResponse(language);
      return new Response(
        JSON.stringify({ reply: crisisReply, crisis: true, history: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── System prompt selection ──────────────────────────────────────
    let systemPrompt: string;

    if (context === 'tarot_pre_reading' && profileSummary) {
      // Short, profile-aware prompt — the persona already knows this person
      const personaName = PERSONA_NAMES[personaId ?? ''] ?? 'Maia';
      systemPrompt = `Du bist ${personaName}, eine weise Tarot-Leserin. Du weißt bereits folgendes über die Person:
${profileSummary}

Aufgabe: Führe ein kurzes, warmes Gespräch (1-2 Nachrichten). Frage nur: Was möchtest du heute mit den Karten erkunden? Kein Smalltalk über die allgemeine Situation — das kennst du schon. Sei warm, direkt, einfühlsam. Maximal 80 Wörter.`;
    } else {
      systemPrompt = getMasterOnboardingSystemPrompt(language, displayName);
    }

    // Build conversation history for Gemini multi-turn
    const historyText = history.length > 0
      ? history.map((m: { role: string; content: string }) =>
          `${m.role === 'user' ? 'Nutzer' : 'Du'}: ${m.content}`
        ).join('\n') + '\n\nNutzer: ' + message.trim()
      : message.trim();

    const reply = await generateText({
      systemPrompt,
      userMessage: historyText,
      maxOutputTokens: 512,
    });

    const updatedHistory = [
      ...history,
      { role: 'user', content: message.trim() },
      { role: 'assistant', content: reply },
    ];

    return new Response(
      JSON.stringify({ reply, history: updatedHistory }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
