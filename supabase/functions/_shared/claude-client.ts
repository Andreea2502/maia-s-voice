const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function callClaude(params: {
  system: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
}): Promise<string> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')!;

  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: params.maxTokens ?? 1024,
      system: params.system,
      messages: params.messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Claude API error: ${response.status} ${text}`);
  }

  const data = await response.json();
  return data.content[0].text as string;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Use OpenAI-compatible embedding via Supabase's built-in or a lightweight model
  // For now, we'll use a simple hash-based placeholder until a real embedding model is configured
  // In production: replace with OpenAI embeddings API or Supabase AI
  const encoded = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-512', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Expand to 1536 dimensions
  const embedding = new Array(1536).fill(0).map((_, i) => {
    return (hashArray[i % hashArray.length] / 255) * 2 - 1;
  });
  return embedding;
}
