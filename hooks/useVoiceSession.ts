/**
 * useVoiceSession.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-duplex voice session with ElevenLabs Conversational AI.
 *
 * Web (via Vercel): captures microphone via getUserMedia → streams PCM audio
 *   to ElevenLabs WS, decodes + queues incoming audio for playback.
 *
 * Native (Expo): uses sendAudio() externally (caller manages capture).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import { VoiceSessionStatus, VoiceSessionToken, TranscriptEntry, VoiceSessionResult } from '@/types/voice';
import { useSupabase } from './useSupabase';

export function useVoiceSession(moduleId: string = 'companion') {
  const supabase = useSupabase();
  const [status, setStatus] = useState<VoiceSessionStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);

  // ── Refs (no re-render on change) ────────────────────────────────────────
  const wsRef        = useRef<WebSocket | null>(null);
  const startTimeRef = useRef<number>(0);
  const statusRef    = useRef<VoiceSessionStatus>('idle'); // stable ref avoids stale closures

  // Web mic capture
  const mediaStreamRef  = useRef<MediaStream | null>(null);
  const audioCtxRef     = useRef<AudioContext | null>(null);
  const processorRef    = useRef<ScriptProcessorNode | null>(null);
  const sourceRef       = useRef<MediaStreamAudioSourceNode | null>(null);

  // Web audio playback queue
  const playbackCtxRef   = useRef<AudioContext | null>(null);
  const audioQueueRef    = useRef<AudioBuffer[]>([]);
  const isPlayingRef     = useRef(false);
  const nextPlayTimeRef  = useRef(0);

  // ── Status helper (keeps ref in sync) ────────────────────────────────────
  function updateStatus(s: VoiceSessionStatus) {
    statusRef.current = s;
    setStatus(s);
  }

  // ── Token fetch ───────────────────────────────────────────────────────────
  const getToken = useCallback(async (): Promise<VoiceSessionToken> => {
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

  // ── Web: play queued audio buffers back-to-back ───────────────────────────
  function scheduleNextChunk() {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    const ctx = playbackCtxRef.current;
    if (!ctx) { isPlayingRef.current = false; return; }

    const buffer = audioQueueRef.current.shift()!;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);

    const now = ctx.currentTime;
    const startAt = Math.max(now, nextPlayTimeRef.current);
    src.start(startAt);
    nextPlayTimeRef.current = startAt + buffer.duration;

    src.onended = () => {
      if (audioQueueRef.current.length === 0) {
        isPlayingRef.current = false;
        if (statusRef.current === 'speaking') updateStatus('listening');
      } else {
        scheduleNextChunk();
      }
    };
  }

  async function enqueueAudioChunk(base64: string) {
    try {
      if (!playbackCtxRef.current) {
        playbackCtxRef.current = new (window as any).AudioContext();
      }
      const ctx = playbackCtxRef.current;

      // Decode base64 → ArrayBuffer
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
      audioQueueRef.current.push(audioBuffer);

      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        scheduleNextChunk();
      }
    } catch (e) {
      console.warn('[useVoiceSession] Audio decode error:', e);
    }
  }

  // ── Web: microphone capture (PCM 16-bit → base64) ─────────────────────────
  async function startMicCapture(ws: WebSocket) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Use 16 kHz AudioContext for PCM capture
      const ctx = new (window as any).AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // 4096-sample buffers → ~250ms chunks at 16 kHz
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event: AudioProcessingEvent) => {
        if (ws.readyState !== WebSocket.OPEN) return;

        const float32 = event.inputBuffer.getChannelData(0);

        // Convert Float32 to Int16 PCM little-endian
        const pcm = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          pcm[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
        }

        // Convert to base64
        const uint8 = new Uint8Array(pcm.buffer);
        let binary = '';
        const chunkSize = 8192;
        for (let i = 0; i < uint8.length; i += chunkSize) {
          binary += String.fromCharCode(...uint8.subarray(i, i + chunkSize));
        }
        const b64 = btoa(binary);

        ws.send(JSON.stringify({ user_audio_chunk: b64 }));
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      console.log('[useVoiceSession] Microphone capture started');
    } catch (err) {
      console.error('[useVoiceSession] Microphone error:', err);
      updateStatus('error');
      setError('Mikrofon nicht verfügbar — bitte Zugriff erlauben');
    }
  }

  // ── Stop microphone capture ───────────────────────────────────────────────
  function stopMicCapture() {
    try {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioCtxRef.current?.close().catch(() => {});
      mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (_) {}
    processorRef.current  = null;
    sourceRef.current     = null;
    audioCtxRef.current   = null;
    mediaStreamRef.current = null;
  }

  // ── Stop playback ─────────────────────────────────────────────────────────
  function stopPlayback() {
    try {
      playbackCtxRef.current?.close().catch(() => {});
    } catch (_) {}
    playbackCtxRef.current = null;
    audioQueueRef.current  = [];
    isPlayingRef.current   = false;
    nextPlayTimeRef.current = 0;
  }

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    updateStatus('connecting');
    setError(null);
    setTranscript([]);
    startTimeRef.current = Date.now();

    try {
      const token = await getToken();
      // Log the URL (with token hidden) for debugging
      const urlForLog = token.wsUrl.replace(/token=[^&]+/, 'token=***');
      console.log(`[useVoiceSession] Connecting to WS: ${urlForLog} agentId=${token.agentId}`);
      const ws = new WebSocket(token.wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        updateStatus('connected');
        console.log('[useVoiceSession] WS open — agentId:', token.agentId);

        // NOTE: conversation_initiation_client_data (system-prompt override) is intentionally
        // NOT sent here. It requires the ElevenLabs agent to have "Allow overrides" enabled
        // in the dashboard (Agent → Security → Allow client-side conversation config).
        // Without that setting, ElevenLabs closes the connection immediately upon receiving this message.
        // Configure the agent system prompt & first-message directly in the ElevenLabs dashboard.
        //
        // To re-enable: turn on "Allow overrides" in ElevenLabs, then uncomment:
        // const overrides = (token as any).overrides;
        // if (overrides?.systemPrompt || overrides?.firstMessage) {
        //   const msg: Record<string, unknown> = { type: 'conversation_initiation_client_data' };
        //   const agentCfg: Record<string, unknown> = {};
        //   if (overrides.systemPrompt) agentCfg.prompt = { prompt: overrides.systemPrompt };
        //   if (overrides.firstMessage) agentCfg.first_message = overrides.firstMessage;
        //   msg.conversation_config_override = { agent: agentCfg };
        //   ws.send(JSON.stringify(msg));
        //   console.log('[useVoiceSession] Sent conversation_initiation_client_data');
        // }

        // Web: start microphone capture after WebSocket is open
        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.mediaDevices) {
          await startMicCapture(ws);
        }
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'conversation_initiation_metadata':
              updateStatus('listening');
              break;

            case 'audio': {
              // ElevenLabs sends audio for playback
              updateStatus('speaking');
              const audioB64 = msg.audio_event?.audio_base_64;
              if (audioB64 && Platform.OS === 'web') {
                await enqueueAudioChunk(audioB64);
              }
              break;
            }

            case 'user_transcript':
              setTranscript((prev) => [
                ...prev,
                {
                  role: 'user',
                  text: msg.user_transcription_event?.user_transcript ?? '',
                  timestamp: Date.now(),
                },
              ]);
              updateStatus('listening');
              break;

            case 'agent_response':
              setTranscript((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  text: msg.agent_response_event?.agent_response ?? '',
                  timestamp: Date.now(),
                },
              ]);
              break;

            case 'internal_tentative_agent_response':
              updateStatus('thinking');
              break;

            case 'conversation_initiation_client_data':
              updateStatus('listening');
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong', event_id: msg.ping_event?.event_id }));
              break;

            case 'agent_response_correction':
            case 'interruption':
              break;
          }
        } catch (_) { /* non-JSON */ }
      };

      ws.onerror = (event) => {
        console.error('[useVoiceSession] WS error:', event);
        updateStatus('error');
        setError('Verbindungsfehler');
        stopMicCapture();
        stopPlayback();
      };

      ws.onclose = (event) => {
        // Log close code so we can diagnose WHY ElevenLabs closed the connection
        // Common codes: 1000=normal, 1006=abnormal (no close frame), 1008=policy violation (bad agent ID), 1011=server error
        console.warn(
          `[useVoiceSession] WS closed — code=${event.code} reason="${event.reason}" wasClean=${event.wasClean} status=${statusRef.current}`
        );
        // Use statusRef (not captured state) to avoid stale closure
        if (statusRef.current !== 'error') {
          updateStatus('ended');
        }
        stopMicCapture();
        stopPlayback();
      };

    } catch (err) {
      updateStatus('error');
      setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen');
    }
  }, [getToken]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    wsRef.current?.close();
    wsRef.current = null;
    stopMicCapture();
    stopPlayback();
    updateStatus('ended');
  }, []);

  // ── Send audio (for native callers) ──────────────────────────────────────
  const sendAudio = useCallback((audioBase64: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ user_audio_chunk: audioBase64 }));
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
