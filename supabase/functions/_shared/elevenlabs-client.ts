import { PersonaId, SupportedLanguage } from './types.ts';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

// Überstimme — universal guide for Onboarding + all non-Tarot modules
const MASTER_AGENT_ID = Deno.env.get('ELEVENLABS_AGENT_ID_MASTER') ?? 'MASTER_AGENT_ID';

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
    throw new Error(`No agent ID configured for module=${params.module} personaId=${params.personaId}`);
  }

  // Get a signed WebSocket URL from ElevenLabs.
  // This works for both public and private agents, and embeds short-lived auth
  // so the client never needs the API key directly.
  const signedRes = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { 'xi-api-key': apiKey } }
  );

  if (!signedRes.ok) {
    const err = await signedRes.text();
    throw new Error(`ElevenLabs signed URL error ${signedRes.status}: ${err.slice(0, 200)}`);
  }

  const { signed_url: wsUrl } = await signedRes.json();
  if (!wsUrl) throw new Error('ElevenLabs returned no signed_url');

  const sessionId = crypto.randomUUID();

  return {
    token: wsUrl,
    sessionId,
    agentId,
    wsUrl,
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
