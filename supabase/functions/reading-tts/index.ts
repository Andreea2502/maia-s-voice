/**
 * POST /reading-tts
 * Liest die Tarot-Deutung mit Gemini TTS (gemini-2.5-flash-preview-tts) vor.
 * Gibt PCM-Audio als base64 zurück – die App spielt es direkt ab.
 *
 * Request: { text: string, persona_id?: string, voice_name?: string }
 * Response: { audio_base64: string, mime_type: "audio/pcm", voice_used: string }
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { getAuthenticatedUser } from '../_shared/auth.ts';
import { textToSpeech, PERSONA_VOICES } from '../_shared/gemini-client.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { supabase, userId } = await getAuthenticatedUser(req);
    const body = await req.json();
    const { text, persona_id, voice_name } = body;

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Max. 3000 Zeichen für TTS (zu lange Texte aufteilen)
    const truncated = text.slice(0, 3000);

    const { audioBase64, mimeType } = await textToSpeech({
      text: truncated,
      personaId: persona_id,
      voiceName: voice_name,
    });

    const voiceUsed = voice_name
      ?? (persona_id ? PERSONA_VOICES[persona_id] : null)
      ?? 'Aoede';

    return new Response(
      JSON.stringify({
        audio_base64: audioBase64,
        mime_type: mimeType,
        voice_used: voiceUsed,
        sample_rate: 24000,
        encoding: 'pcm_s16le',
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
