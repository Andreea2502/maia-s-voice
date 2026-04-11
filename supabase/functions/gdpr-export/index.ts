import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);

    const [profile, readings, memories, consents, subscriptions] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', userId).single(),
      supabase.from('readings').select('*').eq('user_id', userId),
      supabase.from('session_memory').select('id,memory_type,content,importance_score,created_at').eq('user_id', userId),
      supabase.from('consent_log').select('*').eq('user_id', userId),
      supabase.from('user_subscriptions').select('*').eq('user_id', userId),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      gdpr_article: 'Art. 15 GDPR – Right of Access',
      user_profile: profile.data,
      readings: readings.data ?? [],
      session_memories: memories.data ?? [],
      consent_log: consents.data ?? [],
      subscriptions: subscriptions.data ?? [],
    };

    return new Response(JSON.stringify(exportData, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="tarot-data-export-${userId}.json"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
