import type { SupportedLang } from './locale';

/* eslint-disable @typescript-eslint/no-require-imports */
let SpeechModule: any = null;
let isNativeSpeechAvailable = false;

try {
  const mod = require('expo-speech');
  if (mod && typeof mod.speak === 'function') {
    SpeechModule = mod;
    isNativeSpeechAvailable = true;
  }
} catch {
  isNativeSpeechAvailable = false;
}
/* eslint-enable @typescript-eslint/no-require-imports */

let activeSpeech = false;
let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

export function isSpeechSynthesisAvailable(): boolean {
  return isNativeSpeechAvailable;
}

/**
 * Speaks a caller turn using on-device native speech synthesis.
 * If native TTS pod is not compiled in or speech fails, falls back cleanly
 * to simulated reading cadence so call rehearsal is never blocked.
 */
export async function speakCallerTurn(
  text: string,
  lang: SupportedLang,
  onDone?: () => void,
  onError?: () => void,
): Promise<void> {
  // Clear any existing playback or timer
  stopCallerTurn();
  activeSpeech = true;

  if (isNativeSpeechAvailable && SpeechModule) {
    try {
      const bcpLang = lang === 'cs' ? 'cs-CZ' : 'en-US';
      SpeechModule.speak(text, {
        language: bcpLang,
        pitch: 1.0,
        rate: 0.9, // Slightly calm, clear caller pace
        onDone: () => {
          activeSpeech = false;
          onDone?.();
        },
        onStopped: () => {
          activeSpeech = false;
        },
        onError: (err: any) => {
          console.warn('[callSpeech] Native speech error:', err);
          activeSpeech = false;
          onError?.();
          onDone?.();
        },
      });
      return;
    } catch (err) {
      console.warn('[callSpeech] Speech invoke failed, using timer fallback:', err);
    }
  }

  // Graceful fallback for simulator / non-native builds
  // Simulates realistic caller reading pace (~55ms per character, 1.4s - 4.5s)
  const simulatedMs = Math.min(4500, Math.max(1400, text.length * 55));
  fallbackTimer = setTimeout(() => {
    activeSpeech = false;
    fallbackTimer = null;
    onDone?.();
  }, simulatedMs);
}

/**
 * Stops any active caller speech or fallback timer.
 */
export function stopCallerTurn(): void {
  if (fallbackTimer) {
    clearTimeout(fallbackTimer);
    fallbackTimer = null;
  }
  if (isNativeSpeechAvailable && SpeechModule) {
    try {
      SpeechModule.stop();
    } catch {
      // Ignore
    }
  }
  activeSpeech = false;
}
