import { Platform } from 'react-native';
import { supabase } from './supabase';

let currentAudio: HTMLAudioElement | null = null;

/** Speak text via ElevenLabs (edge fn). Falls back to browser TTS on error. */
export async function speak(text: string): Promise<void> {
  stopSpeaking();

  try {
    const { data, error } = await supabase.functions.invoke('ui-tts', {
      body: { text: text.slice(0, 600) },
    });

    if (error || !data?.audio) {
      fallback(text);
      return;
    }

    const src = `data:${data.mime_type ?? 'audio/mpeg'};base64,${data.audio}`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      currentAudio = new Audio(src);
      await currentAudio.play();
    } else {
      // Native: expo-av
      const { Audio } = await import('expo-av');
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: src });
      await sound.playAsync();
    }
  } catch (e) {
    fallback(text);
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined') {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      currentAudio = null;
    }
  }
}

function fallback(text: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }
}
