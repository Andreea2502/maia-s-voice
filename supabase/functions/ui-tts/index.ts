/**
 * POST /ui-tts
 * ElevenLabs TTS for UI elements (consent screen, tooltips).
 * No auth required — limited to 600 chars per call.
 *
 * Request:  { text: string, voice_id?: string }
 * Response: { audio: string (base64), mime_type: "audio/mpeg" }
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';
import { textToSpeech } from '../_shared/elevenlabs-client.ts';

// "Matilda" — warm, mature American female. Override via Supabase secret.
const DEFAULT_VOICE_ID = Deno.env.get('ELEVENLABS_VOICE_TTS') ?? 'XrExE9yKIg1WjnnlVkGX';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voice_id } = await req.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const voiceId = voice_id ?? DEFAULT_VOICE_ID;
    const truncated = text.slice(0, 600);

    const audioBuffer = await textToSpeech({ text: truncated, voiceId });

    // Convert ArrayBuffer → base64
    const bytes = new Uint8Array(audioBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const audio = btoa(binary);

    return new Response(
      JSON.stringify({ audio, mime_type: 'audio/mpeg' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
