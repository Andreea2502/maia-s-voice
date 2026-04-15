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
// Set these in Supabase Edge Function secrets.
// Falls back to well-known ElevenLabs multilingual voices if not configured.
export const PERSONA_VOICE_IDS: Record<string, string> = {
  luna:   Deno.env.get('ELEVENLABS_VOICE_ID_LUNA')   ?? 'EXAVITQu4vr4xnSDxMaL', // Bella — warm, soft
  maya:   Deno.env.get('ELEVENLABS_VOICE_ID_MAYA')   ?? 'AZnzlk1XvdvUeBnXmlld', // Domi — deep, grounded
  zara:   Deno.env.get('ELEVENLABS_VOICE_ID_ZARA')   ?? 'MF3mGyEYCl7XYWbV9V6O', // Elli — clear, direct
  master: Deno.env.get('ELEVENLABS_VOICE_ID_MASTER') ?? '21m00Tcm4TlvDq8ikWAM', // Rachel — neutral guide
};

export async function createConversationalAISession(params: {
  module: string;           // which module is requesting
  personaId?: PersonaId;    // only relevant for tarot
  language: SupportedLanguage;
  systemPromptOverride?: string;
  firstMessage?: string;
}): Promise<{ token: string; sessionId: string; agentId: string; wsUrl: string }> {
  const agentId = (params.module === 'tarot' && params.personaId)
    ? PERSONA_AGENT_MAP[params.personaId]
    : MASTER_AGENT_ID;

  const apiKey = Deno.env.get('ELEVENLABS_API_KEY')!;

  // Step 1: Get a signed URL for the agent (GET endpoint)
  const signedUrlRes = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { 'xi-api-key': apiKey } }
  );

  if (!signedUrlRes.ok) {
    const text = await signedUrlRes.text();
    throw new Error(`ElevenLabs signed URL error: ${signedUrlRes.status} ${text}`);
  }

  const { signed_url } = await signedUrlRes.json();

  // Step 2: If we have overrides, append them as query params on the wss URL
  // ElevenLabs signed URLs are wss:// — we return them directly; overrides are
  // sent after connection via the conversation_initiation_client_data message.
  const wsUrl: string = signed_url;
  const sessionId = crypto.randomUUID();

  return {
    token: signed_url,   // used by client as the wsUrl
    sessionId,
    agentId,
    wsUrl,
    // Pass overrides so client can send them after WS connect
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

  const voiceId = params.voiceId
    ?? (params.personaId ? PERSONA_VOICE_IDS[params.personaId] : null)
    ?? PERSONA_VOICE_IDS.master;

  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.45, similarity_boost: 0.80, style: 0.15 },
        language_code: params.language === 'en' ? 'en' : 'de',
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs TTS error ${response.status}: ${err}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(audioBuffer);
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return { audioBase64: btoa(binary), mimeType: 'audio/mpeg' };
}
