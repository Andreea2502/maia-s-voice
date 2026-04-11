/**
 * POST /reading-interpret
 * Generiert die KI-Tarot-Deutung via Gemini 2.5 Flash.
 * Extrahiert Erinnerungen und speichert sie mit Gemini Embeddings.
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { generateText, generateEmbedding } from '../_shared/gemini-client.ts';
import { getInterpretationPrompt, getMemoryExtractionPrompt } from '../_shared/prompt-templates/interpretation.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);
    const body = await req.json();
    const { reading_id, cards, onboarding_summary, question, voice_used } = body;

    // Reading + Profil laden
    const [{ data: reading }, { data: profile }] = await Promise.all([
      supabase.from('readings').select('*').eq('id', reading_id).eq('user_id', userId).single(),
      supabase.from('user_profiles').select('preferred_language, life_context_summary, preferred_persona').eq('id', userId).single(),
    ]);

    if (!reading || !profile) throw new Error('Not found');

    const lang = profile.preferred_language as string;

    // Kartenbedeutungen aus DB laden
    const cardIds = (cards ?? []).map((c: any) => c.card_id);
    const { data: cardData } = await supabase
      .from('card_library')
      .select('id, name_translations, meaning_upright, meaning_reversed')
      .in('id', cardIds);

    const cardMap = new Map((cardData ?? []).map((c: any) => [c.id, c]));

    // Wiederkehrende Themen aus letzten 5 Readings
    const { data: recentReadings } = await supabase
      .from('readings')
      .select('recurring_themes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    const pastPatterns = Array.from(
      new Set((recentReadings ?? []).flatMap((r: any) => r.recurring_themes ?? []))
    ) as string[];

    // Karten für Prompt aufbereiten
    const cardsForPrompt = (cards ?? []).map((c: any, i: number) => {
      const data = cardMap.get(c.card_id);
      const meaning = c.orientation === 'upright'
        ? data?.meaning_upright?.[lang] ?? data?.meaning_upright?.de ?? ''
        : data?.meaning_reversed?.[lang] ?? data?.meaning_reversed?.de ?? '';
      return {
        ...c,
        positionMeaning: `Position ${i + 1}`,
        cardName: data?.name_translations?.[lang] ?? data?.name_translations?.de ?? c.card_id,
        meaning,
      };
    });

    const systemPrompt = getInterpretationPrompt({
      language: lang as any,
      cards: cardsForPrompt,
      question,
      userContext: JSON.stringify(profile.life_context_summary ?? {}),
      onboardingSummary: onboarding_summary,
      pastPatterns,
    });

    // ── Gemini für Deutung ──────────────────────────────────────────
    const interpretation = await generateText({
      systemPrompt,
      userMessage: lang === 'de'
        ? 'Bitte interpretiere die Karten für diese Person.'
        : 'Please interpret the cards for this person.',
      maxOutputTokens: 900,
    });

    // ── Erinnerungen extrahieren ────────────────────────────────────
    let extractedMemories: any[] = [];
    try {
      const memorySystemPrompt = getMemoryExtractionPrompt(interpretation, onboarding_summary ?? '');
      const memoryJson = await generateText({
        systemPrompt: memorySystemPrompt,
        userMessage: lang === 'de' ? 'Extrahiere die Erinnerungen.' : 'Extract the memories.',
        maxOutputTokens: 400,
      });
      const jsonMatch = memoryJson.match(/\[[\s\S]*\]/);
      if (jsonMatch) extractedMemories = JSON.parse(jsonMatch[0]);
    } catch (_) { /* non-fatal */ }

    // ── Erinnerungen mit Gemini Embeddings speichern ───────────────
    for (const mem of extractedMemories) {
      try {
        const embedding = await generateEmbedding(mem.content);
        await supabase.from('session_memory').insert({
          user_id: userId,
          memory_type: mem.memory_type,
          content: mem.content,
          importance_score: mem.importance_score ?? 0.5,
          source_reading_id: reading_id,
          embedding,
          expires_at: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      } catch (_) { /* non-fatal */ }
    }

    // ── Reading in DB aktualisieren ─────────────────────────────────
    await supabase.from('readings').update({
      cards: cards ?? [],
      onboarding_summary,
      interpretation,
      voice_used: voice_used ?? false,
    }).eq('id', reading_id);

    return new Response(
      JSON.stringify({
        interpretation,
        memories_extracted: extractedMemories,
        model_used: 'gemini-2.5-flash',
      }),
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
