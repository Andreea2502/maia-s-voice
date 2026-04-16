/**
 * POST /reading-tts
 * Liest die Tarot-Deutung mit ElevenLabs vor (Persona-Stimme).
 * Gibt MP3-Audio als base64 zurück — direkt playbar in App + Browser.
 *
 * Request:  { text: string, persona_id?: string, voice_id?: string }
 * Response: { audio: string (base64), mime_type: "audio/mpeg", voice_used: string }
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { textToSpeech, PERSONA_VOICE_IDS } from '../_shared/elevenlabs-client.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, persona_id, voice_id } = body;

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'text is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Max 3000 Zeichen — bei längeren Texten Anfang nehmen
    const truncated = text.slice(0, 3000);

    const { audioBase64, mimeType } = await textToSpeech({
      text: truncated,
      personaId: persona_id,
      voiceId: voice_id,
    });

    const voiceUsed = voice_id
      ?? (persona_id ? PERSONA_VOICE_IDS[persona_id] : null)
      ?? PERSONA_VOICE_IDS.master;

    return new Response(
      JSON.stringify({ audio: audioBase64, mime_type: mimeType, voice_used: voiceUsed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[reading-tts] ERROR:', message);
    const isQuota = message.includes('quota_exceeded') || message.includes('quota of');
    return new Response(JSON.stringify({ error: message, quota_exceeded: isQuota }), {
      status: isQuota ? 402 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
