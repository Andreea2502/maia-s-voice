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
    const { spread_type = 'three_card', question, reading_type = 'tarot', input_mode = 'voice' } = body;

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
    console.log(`[reading-start] userId=${userId} module=${reading_type} spread=${spread_type}`);

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('subscription_tier, readings_this_month, life_context_summary, preferred_language')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[reading-start] Profile fetch error:', JSON.stringify(profileError));
      throw new Error(`Profile fetch failed: ${profileError.message} (code: ${profileError.code})`);
    }
    if (!profile) throw new Error('Profile not found');
    console.log(`[reading-start] profile tier=${profile.subscription_tier} count=${profile.readings_this_month} lang=${profile.preferred_language}`);

    const LIMITS: Record<string, number> = { free: 10, basic: 30, premium: 100, unlimited: -1 };
    const limit = LIMITS[profile.subscription_tier ?? 'free'] ?? 10;
    if (limit !== -1 && (profile.readings_this_month ?? 0) >= limit) {
      return new Response(
        JSON.stringify({ error: 'Monthly reading limit reached', upgrade_required: true }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch relevant session memories for context (non-fatal)
    const { data: memories } = await supabase
      .from('session_memory')
      .select('content, memory_type, importance_score')
      .eq('user_id', userId)
      .order('importance_score', { ascending: false })
      .limit(5);

    // Create reading row
    console.log('[reading-start] Inserting reading...');
    const { data: reading, error: readingError } = await supabase
      .from('readings')
      .insert({
        user_id: userId,
        reading_type,
        spread_type,
        question: question ?? null,
        interpretation_language: profile.preferred_language ?? 'de',
        input_mode,
        voice_used: input_mode === 'voice',
        cards: [],
        module: 'tarot',
      })
      .select()
      .single();

    if (readingError) {
      console.error('[reading-start] Insert error:', JSON.stringify(readingError));
      throw new Error(`Reading insert failed: ${readingError.message} (code: ${readingError.code})`);
    }

    // Increment reading count (non-fatal)
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
    const message = err instanceof Error ? err.message : String(err);
    console.error('[reading-start] CAUGHT ERROR:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
