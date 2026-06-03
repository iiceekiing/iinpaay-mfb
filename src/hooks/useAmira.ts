import { useCallback, useRef } from 'react';
import { useStore } from '../store';
import { LANG_VOICE_CODE } from '../constants/langs';
import type { LangCode } from '../types';

// ── Web Speech API types ──────────────────────────────────────
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((ev: SpeechRecognitionEvent) => void) | null;
  onerror:  ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend:    (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface ISpeechRecognitionCtor { new(): ISpeechRecognition; }

declare global {
  interface Window {
    SpeechRecognition:       ISpeechRecognitionCtor;
    webkitSpeechRecognition: ISpeechRecognitionCtor;
  }
}

/** Check whether the browser supports SpeechRecognition at all */
export function isSpeechSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// ── Voice selection ───────────────────────────────────────────
function getBestVoice(targetLang: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find(v => v.lang === targetLang) ??
    voices.find(v => v.lang.startsWith((targetLang.split('-')[0]) ?? '')) ??
    voices.find(v => v.lang.startsWith('en')) ??
    voices[0] ??
    null
  );
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── Hook ──────────────────────────────────────────────────────
export function useAmira() {
  const language     = useStore(s => s.language);
  const setAmiraText = useStore(s => s.setAmiraText);
  const setSpeaking  = useStore(s => s.setSpeaking);
  const setListening = useStore(s => s.setListening);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const speakCancelRef = useRef<boolean>(false);

  // ── Text-to-Speech ────────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) {
        setAmiraText(text);
        setSpeaking(false);
        resolve();
        return;
      }

      speakCancelRef.current = false;
      window.speechSynthesis.cancel();
      setAmiraText(text);
      setSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceCode = LANG_VOICE_CODE[language as LangCode] || 'en-NG';

      const trySpeak = () => {
        if (speakCancelRef.current) { setSpeaking(false); resolve(); return; }
        const voice = getBestVoice(voiceCode);
        if (voice) utterance.voice = voice;
        utterance.lang   = voiceCode;
        utterance.rate   = 0.88;
        utterance.pitch  = 1.05;
        utterance.volume = 1;
        utterance.onend   = () => { setSpeaking(false); resolve(); };
        utterance.onerror = () => { setSpeaking(false); resolve(); };
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = trySpeak;
      } else {
        trySpeak();
      }
    });
  }, [language, setAmiraText, setSpeaking]);

  const stopSpeaking = useCallback(() => {
    speakCancelRef.current = true;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [setSpeaking]);

  // ── Speech Recognition ────────────────────────────────────
  const listen = useCallback((timeoutMs = 9000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { reject(new Error('not-supported')); return; }

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }

      const rec: ISpeechRecognition = new SR();
      recognitionRef.current = rec;
      rec.lang             = 'en-NG';
      rec.continuous       = false;
      rec.interimResults   = false;
      rec.maxAlternatives  = 3;

      setListening(true);

      const timeoutId = setTimeout(() => {
        try { rec.stop(); } catch { /* ignore */ }
        setListening(false);
        reject(new Error('timeout'));
      }, timeoutMs);

      rec.onresult = (event: SpeechRecognitionEvent) => {
        clearTimeout(timeoutId);
        setListening(false);
        const transcript = event.results[0]?.[0]?.transcript ?? '';
        resolve(transcript.trim());
      };

      rec.onerror = (event: SpeechRecognitionErrorEvent) => {
        clearTimeout(timeoutId);
        setListening(false);
        reject(new Error(event.error));
      };

      rec.onend = () => {
        clearTimeout(timeoutId);
        setListening(false);
      };

      try { rec.start(); } catch (e) {
        clearTimeout(timeoutId);
        setListening(false);
        reject(e);
      }
    });
  }, [setListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }
    setListening(false);
  }, [setListening]);

  /**
   * converse — speak a prompt, then automatically begin listening.
   * Returns the captured speech string, or null on timeout/error.
   * This is the primary building block for the conversation loop.
   */
  const converse = useCallback(async (
    text: string,
    opts?: { listenMs?: number; pauseMs?: number }
  ): Promise<string | null> => {
    await speak(text);
    // Brief pause so the user can process what was said
    await delay(opts?.pauseMs ?? 350);
    try {
      return await listen(opts?.listenMs ?? 9000);
    } catch {
      return null;
    }
  }, [speak, listen]);

  /**
   * retry — call converse up to `maxTries` times until a non-empty response.
   */
  const retry = useCallback(async (
    promptText: string,
    retryText: string,
    validate: (s: string) => boolean,
    maxTries = 2
  ): Promise<string | null> => {
    for (let i = 0; i < maxTries; i++) {
      const resp = await converse(i === 0 ? promptText : retryText);
      if (resp && validate(resp)) return resp;
    }
    return null;
  }, [converse]);

  // ── Shorthand: speak then listen ─────────────────────────
  const prompt = useCallback(async (
    text: string,
    timeoutMs = 9000
  ): Promise<string | null> => {
    await speak(text);
    try { return await listen(timeoutMs); } catch { return null; }
  }, [speak, listen]);

  return {
    speak,
    listen,
    converse,
    retry,
    prompt,
    stopSpeaking,
    stopListening,
    isSpeechSupported,
  };
}
