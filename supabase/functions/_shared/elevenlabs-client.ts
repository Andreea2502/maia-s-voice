import { PersonaId, SupportedLanguage } from './types.ts';

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

const PERSONA_AGENT_MAP: Record<PersonaId, string> = {
  mystic_elena: Deno.env.get('ELEVENLABS_AGENT_ID_ELENA') ?? 'AGENT_ID_ELENA',
  sage_amira:   Deno.env.get('ELEVENLABS_AGENT_ID_AMIRA') ?? 'AGENT_ID_AMIRA',
  guide_priya:  Deno.env.get('ELEVENLABS_AGENT_ID_PRIYA') ?? 'AGENT_ID_PRIYA',
};

export async function createConversationalAISession(params: {
  personaId: PersonaId;
  language: SupportedLanguage;
  systemPromptOverride?: string;
  firstMessage?: string;
}): Promise<{ token: string; sessionId: string; agentId: string; wsUrl: string }> {
  const agentId = PERSONA_AGENT_MAP[params.personaId];
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY')!;

  const body: Record<string, unknown> = { agent_id: agentId };
  if (params.systemPromptOverride) {
    body.system_prompt_override = params.systemPromptOverride;
  }
  if (params.firstMessage) {
    body.first_message = params.firstMessage;
  }

  const response = await fetch(`${ELEVENLABS_API_BASE}/convai/conversation/token`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`ElevenLabs token error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return {
    token: data.token,
    sessionId: data.session_id ?? crypto.randomUUID(),
    agentId,
    wsUrl: `wss://api.elevenlabs.io/v1/convai/conversation?token=${data.token}`,
  };
}

export async function textToSpeech(params: {
  text: string;
  voiceId: string;
  language?: SupportedLanguage;
}): Promise<ArrayBuffer> {
  const apiKey = Deno.env.get('ELEVENLABS_API_KEY')!;
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/text-to-speech/${params.voiceId}`,
    {
      method: 'POST',
      headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: params.text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );
  if (!response.ok) throw new Error(`TTS error: ${response.status}`);
  return response.arrayBuffer();
}
