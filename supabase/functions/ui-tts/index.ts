/**
 * ui-tts — Text-to-Speech für UI-Texte (Einwilligungen, Consent-Screen usw.)
 * ElevenLabs TTS → MP3 (direkt playbar, keine Konvertierung nötig)
 * Kein Auth erforderlich — max 1000 Zeichen pro Aufruf
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { textToSpeech } from '../_shared/elevenlabs-client.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, personaId } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { audioBase64, mimeType } = await textToSpeech({
      text: text.slice(0, 1000),
      personaId: personaId ?? 'master',
    });

    return new Response(
      JSON.stringify({ audio: audioBase64, mime_type: mimeType }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'TTS error';
    console.error('[ui-tts] ERROR:', message);

    // Detect quota_exceeded → return 402 so client can handle gracefully
    const isQuota = message.includes('quota_exceeded') || message.includes('quota of');
    return new Response(
      JSON.stringify({ error: message, quota_exceeded: isQuota }),
      { status: isQuota ? 402 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
