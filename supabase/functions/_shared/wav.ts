/**
 * PCM → WAV converter for Deno (Edge Functions)
 * Gemini TTS returns raw PCM 16-bit 24kHz mono.
 * Both browser Audio and expo-av need a WAV container to play it.
 */
export function pcmBase64ToWavBase64(
  pcmBase64: string,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16,
): string {
  // Decode base64 PCM → bytes
  const pcmBinary = atob(pcmBase64);
  const pcmBytes  = new Uint8Array(pcmBinary.length);
  for (let i = 0; i < pcmBinary.length; i++) {
    pcmBytes[i] = pcmBinary.charCodeAt(i);
  }

  const dataSize   = pcmBytes.length;
  const byteRate   = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const buffer     = new ArrayBuffer(44 + dataSize);
  const view       = new DataView(buffer);

  function str(offset: number, s: string) {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  }

  // RIFF chunk
  str(0,  'RIFF');
  view.setUint32(4, 36 + dataSize, true);  // ChunkSize
  str(8,  'WAVE');

  // fmt sub-chunk
  str(12, 'fmt ');
  view.setUint32(16, 16, true);            // Subchunk1Size (PCM)
  view.setUint16(20,  1, true);            // AudioFormat   (PCM = 1)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data sub-chunk
  str(36, 'data');
  view.setUint32(40, dataSize, true);
  new Uint8Array(buffer).set(pcmBytes, 44);

  // Encode WAV → base64
  const wavBytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < wavBytes.length; i++) {
    binary += String.fromCharCode(wavBytes[i]);
  }
  return btoa(binary);
}
