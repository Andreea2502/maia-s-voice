import { PersonaId, SupportedLanguage } from './types.ts';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Überstimme — universal guide for Onboarding + all non-Tarot modules
// Fallback chain: MASTER → LUNA → MAYA (so MAIA always has a valid agent)
const MASTER_AGENT_ID =
  Deno.env.get('ELEVENLABS_AGENT_ID_MASTER') ||
  Deno.env.get('ELEVENLABS_AGENT_ID_LUNA')   ||
  Deno.env.get('ELEVENLABS_AGENT_ID_MAYA')   ||
  '';

// Tarot personas — selectable inside Tarot module
// Luna = former Elena agent, Maya = former Amira agent, Zara = new (former Priya)
const PERSONA_AGENT_MAP: Record<PersonaId, string> = {
  luna: Deno.env.get('ELEVENLABS_AGENT_ID_LUNA') ?? '',   // agent_1701knxfa9wqf1evsa4c30v6nzy4
  zara: Deno.env.get('ELEVENLABS_AGENT_ID_ZARA') ?? '',   // TODO: create in ElevenLabs dashboard
  maya: Deno.env.get('ELEVENLABS_AGENT_ID_MAYA') ?? '',   // agent_6501knxg0zxhe9srdgt3kypg6z9b
};

// ─── Voice IDs for direct TTS (separate from ConvAI agents) ─────
// Primary: read from Supabase secrets (set via: npx supabase secrets set ELEVENLABS_VOICE_ID_LUNA=xxx)
// Fallback: Mila Winter (DcCu06FiOZma2KVNUoPZ) — confirmed in user's ElevenLabs account
export const PERSONA_VOICE_IDS: Record<string, string> = {
  luna:   Deno.env.get('ELEVENLABS_VOICE_ID_LUNA')   ?? 'DcCu06FiOZma2KVNUoPZ',
  maya:   Deno.env.get('ELEVENLABS_VOICE_ID_MAYA')   ?? 'DcCu06FiOZma2KVNUoPZ',
  zara:   Deno.env.get('ELEVENLABS_VOICE_ID_ZARA')   ?? 'DcCu06FiOZma2KVNUoPZ',
  master: Deno.env.get('ELEVENLABS_VOICE_ID_MASTER') ?? 'DcCu06FiOZma2KVNUoPZ',
};

export async function createConversationalAISession(params: {
  module: string;           // which module is requesting
  personaId?: PersonaId;    // only relevant for tarot
  language: SupportedLanguage;
  systemPromptOverride?: string;
  firstMessage?: string;
}): Promise<{ token: string; sessionId: string; agentId: string; wsUrl: string }> {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  const agentId = (params.module === 'tarot' && params.personaId)
    ? PERSONA_AGENT_MAP[params.personaId]
    : MASTER_AGENT_ID;

  if (!agentId) {
    throw new Error(
      `No ElevenLabs agent ID configured for module="${params.module}" personaId="${params.personaId ?? '–'}". ` +
      `Set ELEVENLABS_AGENT_ID_MASTER (or ELEVENLABS_AGENT_ID_LUNA as fallback) via: npx supabase secrets set ELEVENLABS_AGENT_ID_MASTER=agent_xxx`
    );
  }

  console.log(`[elevenlabs] Using agent ${agentId} for module=${params.module}`);

  // Get a signed WebSocket URL from ElevenLabs.
  // Signed URLs embed a short-lived token so the client never needs the API key directly.
  // Works for both public and private agents.
  let wsUrl: string;

  try {
    const signedRes = await fetch(
      `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { 'xi-api-key': apiKey } }
    );

    if (!signedRes.ok) {
      const errBody = await signedRes.text();
      console.error(`[elevenlabs] get_signed_url failed ${signedRes.status}: ${errBody.slice(0, 300)}`);
      // Fallback: try the public (unsigned) URL — only works if agent is set to public access
      wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}`;
      console.warn('[elevenlabs] Falling back to public WS URL');
    } else {
      const json = await signedRes.json();
      wsUrl = json.signed_url;
      if (!wsUrl) {
        console.error('[elevenlabs] get_signed_url returned no signed_url:', JSON.stringify(json));
        wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}`;
      } else {
        console.log(`[elevenlabs] Got signed URL for agent ${agentId}`);
      }
    }
  } catch (fetchErr) {
    console.error('[elevenlabs] get_signed_url fetch threw:', fetchErr);
    wsUrl = `wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${encodeURIComponent(agentId)}`;
  }

  const sessionId = crypto.randomUUID();

  // Audio format configured in the ElevenLabs agent dashboard.
  // Must match exactly so the client can decode the raw PCM/ulaw bytes.
  // Supported: pcm_16000 | pcm_22050 | pcm_24000 | ulaw_8000
  // Set via: npx supabase secrets set ELEVENLABS_AUDIO_FORMAT=pcm_16000
  const audioFormat = Deno.env.get('ELEVENLABS_AUDIO_FORMAT') ?? 'pcm_16000';

  return {
    token: wsUrl,
    sessionId,
    agentId,
    wsUrl,
    audioFormat,
    ...(params.systemPromptOverride || params.firstMessage
      ? { overrides: { systemPrompt: params.systemPromptOverride, firstMessage: params.firstMessage } }
      : {}),
  } as any;
}

export async function textToSpeech(params: {
  text: string;
  voiceId?: string;
  personaId?: string;
  language?: SupportedLanguage;
}): Promise<{ audioBase64: string; mimeType: 'audio/mpeg' }> {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  // Resolve voice ID — persona-specific first, then master, then hardcoded fallback
  const resolvedVoiceId = params.voiceId
    ?? (params.personaId ? PERSONA_VOICE_IDS[params.personaId] : null)
    ?? PERSONA_VOICE_IDS.master;

  console.log(`[elevenlabs-tts] personaId=${params.personaId ?? 'none'} voiceId=${resolvedVoiceId} chars=${params.text.length}`);

  // Try primary voice first, fall back to master on 4xx
  async function tryVoice(voiceId: string): Promise<Response> {
    return fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: params.text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: { stability: 0.45, similarity_boost: 0.80 },
        }),
      }
    );
  }

  let response = await tryVoice(resolvedVoiceId);

  // If primary voice fails with a client error and it's not the master voice, retry with master
  if (!response.ok && response.status >= 400 && response.status < 500 && resolvedVoiceId !== PERSONA_VOICE_IDS.master) {
    const errBody = await response.text();
    console.warn(`[elevenlabs-tts] Primary voice ${resolvedVoiceId} failed (${response.status}: ${errBody}), retrying with master voice ${PERSONA_VOICE_IDS.master}`);
    response = await tryVoice(PERSONA_VOICE_IDS.master);
  }

  if (!response.ok) {
    const err = await response.text();
    console.error(`[elevenlabs-tts] FINAL ERROR — status=${response.status} voiceId=${resolvedVoiceId} apiKeyLen=${apiKey.length} body=${err}`);
    throw new Error(`ElevenLabs TTS ${response.status}: ${err.slice(0, 300)}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(audioBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  console.log(`[elevenlabs-tts] OK — ${bytes.length} bytes`);
  return { audioBase64: btoa(binary), mimeType: 'audio/mpeg' };
}
