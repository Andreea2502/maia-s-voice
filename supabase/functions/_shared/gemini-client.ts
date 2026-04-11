/**
 * Gemini Client – ONE API KEY für alles:
 * - Text-Generierung (Interpretation)     → gemini-2.5-flash
 * - Vision / Bild-Analyse (Karten-Foto)  → gemini-2.5-flash
 * - Text-to-Speech (Deutung vorlesen)     → gemini-2.5-flash-preview-tts
 * - Audio-Transkription (STT fallback)    → gemini-2.5-flash
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ─────────────────────────────────────────────
// Modelle
// ─────────────────────────────────────────────
const MODELS = {
  text:    'gemini-2.5-flash',
  vision:  'gemini-2.5-flash',          // gleiche API, nur mit Bild-Part
  tts:     'gemini-2.5-flash-preview-tts',
  pro:     'gemini-2.5-pro',            // für komplexere Interpretationen (optional)
} as const;

function apiKey(): string {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY not set');
  return key;
}

// ─────────────────────────────────────────────
// 1. TEXT GENERATION
// ─────────────────────────────────────────────
export async function generateText(params: {
  systemPrompt: string;
  userMessage: string;
  maxOutputTokens?: number;
  usePro?: boolean;
}): Promise<string> {
  const model = params.usePro ? MODELS.pro : MODELS.text;

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: params.systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: params.userMessage }] }],
        generationConfig: {
          maxOutputTokens: params.maxOutputTokens ?? 1024,
          temperature: 0.85,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini text error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini: No text in response');
  return text;
}

// ─────────────────────────────────────────────
// 2. VISION – Bild analysieren (Karten-Erkennung)
// ─────────────────────────────────────────────
export async function analyzeImage(params: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
}): Promise<string> {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${MODELS.vision}:generateContent?key=${apiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [
            {
              inline_data: {
                mime_type: params.mimeType,
                data: params.imageBase64,
              },
            },
            { text: params.prompt },
          ],
        }],
        generationConfig: { maxOutputTokens: 512, temperature: 0.2 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini vision error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini Vision: No text in response');
  return text;
}

// ─────────────────────────────────────────────
// 3. TEXT-TO-SPEECH
// Gibt PCM-Audio als base64 zurück (16-bit, 24 kHz, mono)
// ─────────────────────────────────────────────

// Stimmen-Map pro Persona – aus den 30 Gemini-Voices
export const PERSONA_VOICES: Record<string, string> = {
  mystic_elena: 'Aoede',   // Warm, ruhig
  sage_amira:   'Kore',    // Tief, mystisch
  guide_priya:  'Puck',    // Klar, direkt, lebendig
};

export async function textToSpeech(params: {
  text: string;
  voiceName?: string;
  personaId?: string;
}): Promise<{ audioBase64: string; mimeType: 'audio/pcm' }> {
  const voice = params.voiceName
    ?? (params.personaId ? PERSONA_VOICES[params.personaId] : null)
    ?? 'Aoede';

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${MODELS.tts}:generateContent?key=${apiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: params.text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini TTS error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const audioPart = data.candidates?.[0]?.content?.parts?.[0];
  if (!audioPart?.inline_data?.data) {
    throw new Error('Gemini TTS: No audio in response');
  }

  return {
    audioBase64: audioPart.inline_data.data,
    mimeType:    'audio/pcm',
  };
}

// ─────────────────────────────────────────────
// 4. EMBEDDING (für session_memory Semantic Search)
// Gemini Embedding ersetzt OpenAI ada-002
// ─────────────────────────────────────────────
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/gemini-embedding-001:embedContent?key=${apiKey()}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] },
        taskType: 'RETRIEVAL_DOCUMENT',
      }),
    }
  );

  if (!response.ok) {
    // Fallback: deterministischer Hash (für Entwicklung ohne Embedding-Kosten)
    const encoded = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-512', encoded);
    const arr = Array.from(new Uint8Array(buf));
    return new Array(768).fill(0).map((_, i) => (arr[i % arr.length] / 255) * 2 - 1);
  }

  const data = await response.json();
  return data.embedding?.values ?? [];
}
