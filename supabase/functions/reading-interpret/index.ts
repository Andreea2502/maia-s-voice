/**
 * POST /reading-interpret
 * Generiert die KI-Tarot-Deutung via Gemini 2.5 Flash.
 * Extrahiert Erinnerungen und speichert sie mit Gemini Embeddings.
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getOptionalUser } from '../_shared/auth.ts';
import { generateText, generateEmbedding } from '../_shared/gemini-client.ts';
import { getInterpretationPrompt, getMemoryExtractionPrompt } from '../_shared/prompt-templates/interpretation.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getOptionalUser(req);
    const body = await req.json();
    const { reading_id, cards, onboarding_summary, question, voice_used } = body;

    let lang = 'de';
    let pastPatterns: string[] = [];
    let userContext = '';

    if (userId) {
      const [{ data: profile }, { data: recentReadings }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('preferred_language, life_context_summary, personal_profile')
          .eq('id', userId)
          .single(),
        supabase
          .from('readings')
          .select('recurring_themes')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      lang = profile?.preferred_language ?? 'de';
      pastPatterns = Array.from(
        new Set((recentReadings ?? []).flatMap((r: any) => r.recurring_themes ?? []))
      ) as string[];

      // Build userContext from personal_profile
      const pp = (profile?.personal_profile as any) ?? {};
      userContext = [
        pp.displayName       ? `Name: ${pp.displayName}`                              : '',
        pp.pronouns          ? `Pronomen: ${pp.pronouns}`                             : '',
        pp.relationshipStatus ? `Beziehungsstatus: ${pp.relationshipStatus}`          : '',
        pp.lifeFocus         ? `Aktueller Fokus: ${pp.lifeFocus}`                     : '',
        pp.areasOfInterest?.length
          ? `Wichtige Bereiche: ${pp.areasOfInterest.join(', ')}`                     : '',
        pp.characterDesc     ? `Selbstbeschreibung: ${pp.characterDesc}`              : '',
        pp.conflictStyle     ? `Konfliktstil: ${pp.conflictStyle}`                    : '',
        pp.openQuestion      ? `Offene Frage: ${pp.openQuestion}`                     : '',
      ].filter(Boolean).join('\n');
    }

    // Kartenbedeutungen aus DB laden (works without auth — card_library is public)
    const cardIds = (cards ?? []).map((c: any) => c.card_id);
    const { data: cardData } = await supabase
      .from('card_library')
      .select('id, name_translations, meaning_upright, meaning_reversed')
      .in('id', cardIds);

    const cardMap = new Map((cardData ?? []).map((c: any) => [c.id, c]));

    // Karten für Prompt aufbereiten
    // Fallback-Reihenfolge für Kartennamen:
    // 1. Übersetzung aus card_library DB
    // 2. Name den die App mitschickt (c.cardName)
    // 3. Rohe card_id als letzter Ausweg
    const cardsForPrompt = (cards ?? []).map((c: any, i: number) => {
      const data = cardMap.get(c.card_id);
      const cardName = data?.name_translations?.[lang]
        ?? data?.name_translations?.de
        ?? c.cardName   // vom Client mitgeschickt — wichtigster Fallback
        ?? c.card_id;
      const meaning = c.orientation === 'upright'
        ? data?.meaning_upright?.[lang] ?? data?.meaning_upright?.de ?? ''
        : data?.meaning_reversed?.[lang] ?? data?.meaning_reversed?.de ?? '';
      return {
        ...c,
        positionMeaning: c.positionMeaning ?? c.positionLabel ?? `Position ${i + 1}`,
        cardName,
        meaning,
      };
    });

    const systemPrompt = getInterpretationPrompt({
      language: lang as any,
      cards: cardsForPrompt,
      spreadTitle: body.spreadTitle ?? '',
      question,
      userContext,
      onboardingSummary: onboarding_summary,
      pastPatterns,
      memoryEnabled: false,     // true once user is logged in and consented
      personaId: body.persona_id,
    });

    // ── Gemini für Deutung ──────────────────────────────────────────
    const interpretation = await generateText({
      systemPrompt,
      userMessage: lang === 'de'
        ? 'Bitte interpretiere die Karten für diese Person.'
        : 'Please interpret the cards for this person.',
      maxOutputTokens: 3000,
    });

    // ── Erinnerungen extrahieren ────────────────────────────────────
    let extractedMemories: any[] = [];
    try {
      const memorySystemPrompt = getMemoryExtractionPrompt(interpretation, onboarding_summary ?? '', false);
      const memoryJson = await generateText({
        systemPrompt: memorySystemPrompt,
        userMessage: lang === 'de' ? 'Extrahiere die Erinnerungen.' : 'Extract the memories.',
        maxOutputTokens: 400,
      });
      const jsonMatch = memoryJson.match(/\[[\s\S]*\]/);
      if (jsonMatch) extractedMemories = JSON.parse(jsonMatch[0]);
    } catch (_) { /* non-fatal */ }

    // ── Erinnerungen + DB-Update nur für eingeloggte User ──────────
    if (userId && reading_id && !reading_id.startsWith('guest_')) {
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

      await supabase.from('readings').update({
        cards: cards ?? [],
        onboarding_summary,
        interpretation,
        voice_used: voice_used ?? false,
      }).eq('id', reading_id);
    }

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
