import { useState, useCallback, useRef } from 'react';
import { VoiceSessionStatus, VoiceSessionToken, TranscriptEntry, VoiceSessionResult } from '@/types/voice';
import { useSupabase } from './useSupabase';

export function useVoiceSession(moduleId: string = 'companion') {
  const supabase = useSupabase();
  const [status, setStatus] = useState<VoiceSessionStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const startTimeRef = useRef<number>(0);

  const getToken = useCallback(async (): Promise<VoiceSessionToken> => {
    // Ensure we have a fresh session token before calling the authenticated function
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Nicht eingeloggt — bitte neu anmelden');

    const { data, error } = await supabase.functions.invoke('voice-token', {
      body: { module: moduleId },
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Keine Antwort vom Server');
    return data as VoiceSessionToken;
  }, [supabase, moduleId]);

  const connect = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    setTranscript([]);
    startTimeRef.current = Date.now();

    try {
      const token = await getToken();
      const ws = new WebSocket(token.wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        // Send system prompt + first message overrides if present
        const overrides = (token as any).overrides;
        if (overrides?.systemPrompt || overrides?.firstMessage) {
          const msg: Record<string, unknown> = { type: 'conversation_initiation_client_data' };
          const agentCfg: Record<string, unknown> = {};
          if (overrides.systemPrompt) agentCfg.prompt = { prompt: overrides.systemPrompt };
          if (overrides.firstMessage) agentCfg.first_message = overrides.firstMessage;
          msg.conversation_config_override = { agent: agentCfg };
          ws.send(JSON.stringify(msg));
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'conversation_initiation_metadata':
              setStatus('listening');
              break;
            case 'audio':
              setStatus('speaking');
              break;
            case 'user_transcript':
              setTranscript((prev) => [
                ...prev,
                { role: 'user', text: msg.user_transcription_event?.user_transcript ?? '', timestamp: Date.now() },
              ]);
              setStatus('listening');
              break;
            case 'agent_response':
              setTranscript((prev) => [
                ...prev,
                { role: 'assistant', text: msg.agent_response_event?.agent_response ?? '', timestamp: Date.now() },
              ]);
              break;
            case 'internal_tentative_agent_response':
              setStatus('thinking');
              break;
            case 'conversation_initiation_client_data':
              setStatus('listening');
              break;
            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', event_id: msg.ping_event?.event_id }));
              break;
            case 'agent_response_correction':
              break;
          }
        } catch (_) { /* non-JSON messages */ }
      };

      ws.onerror = () => {
        setStatus('error');
        setError('Connection error');
      };

      ws.onclose = (e) => {
        if (status !== 'error') setStatus('ended');
      };
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [getToken, status]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus('ended');
  }, []);

  const sendAudio = useCallback((audioBase64: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ user_audio_chunk: audioBase64 })
      );
    }
  }, []);

  const getResult = useCallback((): VoiceSessionResult => ({
    transcript,
    summary,
    durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
  }), [transcript, summary]);

  return {
    status,
    transcript,
    summary,
    error,
    connect,
    disconnect,
    sendAudio,
    getResult,
    setSummary,
  };
}
