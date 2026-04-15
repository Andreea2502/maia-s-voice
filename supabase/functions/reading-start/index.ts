import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getOptionalUser } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getOptionalUser(req);
    const body = await req.json();
    const { spread_type = 'three_card', question, reading_type = 'virtual', input_mode = 'voice' } = body;

    // Guest mode — no DB, no limits
    if (!userId) {
      return new Response(
        JSON.stringify({
          reading_id: `guest_${Date.now()}`,
          user_context_summary: null,
          relevant_memories: [],
          spread_type,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch profile + check reading limits
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('subscription_tier, readings_this_month, life_context_summary, preferred_language')
      .eq('id', userId)
      .single();

    if (!profile) throw new Error('Profile not found');

    const LIMITS: Record<string, number> = { free: 2, basic: 10, premium: 30, unlimited: -1 };
    const limit = LIMITS[profile.subscription_tier] ?? 2;
    if (limit !== -1 && profile.readings_this_month >= limit) {
      return new Response(
        JSON.stringify({ error: 'Monthly reading limit reached', upgrade_required: true }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch relevant session memories for context
    const { data: memories } = await supabase
      .from('session_memory')
      .select('content, memory_type, importance_score')
      .eq('user_id', userId)
      .order('importance_score', { ascending: false })
      .limit(5);

    // Create reading row
    const { data: reading, error: readingError } = await supabase
      .from('readings')
      .insert({
        user_id: userId,
        reading_type,
        spread_type,
        question,
        interpretation_language: profile.preferred_language,
        input_mode,
        cards: [],
      })
      .select()
      .single();

    if (readingError) throw readingError;

    // Increment reading count
    await supabase
      .from('user_profiles')
      .update({ readings_this_month: (profile.readings_this_month ?? 0) + 1 })
      .eq('id', userId);

    return new Response(
      JSON.stringify({
        reading_id: reading.id,
        user_context_summary: profile.life_context_summary,
        relevant_memories: memories ?? [],
        spread_type,
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
