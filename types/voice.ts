export type VoiceSessionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'ended'
  | 'error';

export interface VoiceSessionToken {
  token: string;
  sessionId: string;
  agentId: string;
  wsUrl: string;
}

export interface TranscriptEntry {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface VoiceSessionResult {
  transcript: TranscriptEntry[];
  summary: string;
  durationSeconds: number;
}

export type InputMode = 'voice' | 'text';
