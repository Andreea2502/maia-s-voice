/**
 * POST /memory-query
 * Sucht relevante Session-Memories via semantischer Suche (Gemini Embeddings).
 *
 * Request:  { query: string, limit?: number }
 * Response: { memories: Array<{ id, content, memory_type, importance_score, similarity }> }
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { generateEmbedding } from '../_shared/gemini-client.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);
    const body = await req.json();
    const { query, limit = 5 } = body;

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const embedding = await generateEmbedding(query);

    const { data: memories, error } = await supabase.rpc('match_memories', {
      query_embedding: embedding,
      match_user_id: userId,
      match_count: Math.min(limit, 20),
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ memories: memories ?? [] }),
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
