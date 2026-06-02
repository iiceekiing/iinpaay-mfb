import { useCallback, useRef } from 'react';
import { useStore } from '../store';
import { LANG_VOICE_CODE } from '../constants/langs';
import type { LangCode } from '../types';

// Web Speech API types
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
  onerror: ((ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
interface ISpeechRecognitionConstructor {
  new(): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: ISpeechRecognitionConstructor;
    webkitSpeechRecognition: ISpeechRecognitionConstructor;
  }
}

// ── Text-to-Speech ────────────────────────────────────────────

function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Try exact language match
  let v = voices.find(v => v.lang === langCode);
  if (v) return v;
  // Try language prefix match
  const prefix = langCode.split('-')[0];
  v = voices.find(v => v.lang.startsWith(prefix ?? ''));
  if (v) return v;
  // Fall back to English
  v = voices.find(v => v.lang.startsWith('en'));
  if (v) return v;
  return voices[0] ?? null;
}

export function useAmira() {
  const language    = useStore(s => s.language);
  const setAmiraText = useStore(s => s.setAmiraText);
  const setSpeaking  = useStore(s => s.setSpeaking);
  const setListening = useStore(s => s.setListening);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      if (!('speechSynthesis' in window)) {
        setAmiraText(text);
        setSpeaking(false);
        resolve();
        return;
      }

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      setAmiraText(text);
      setSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceCode = LANG_VOICE_CODE[language as LangCode] || 'en-NG';

      // Voices may not be loaded yet
      const trySpeak = () => {
        const voice = getBestVoice(voiceCode);
        if (voice) utterance.voice = voice;
        utterance.lang  = voiceCode;
        utterance.rate  = 0.88;
        utterance.pitch = 1.05;
        utterance.volume = 1;

        utterance.onend = () => { setSpeaking(false); resolve(); };
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
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [setSpeaking]);

  // ── Speech Recognition ────────────────────────────────────────

  const listen = useCallback((timeoutMs = 8000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        reject(new Error('SpeechRecognition not supported in this browser'));
        return;
      }

      // Stop previous if any
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }

      const recognition: ISpeechRecognition = new SR();
      recognitionRef.current = recognition;

      // Always use English for recognition (most reliable across browsers)
      // Amira speaks in the user's language; recognition processes English responses
      recognition.lang = 'en-NG';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 3;

      setListening(true);

      const timeout = setTimeout(() => {
        try { recognition.stop(); } catch { /* ignore */ }
        setListening(false);
        reject(new Error('timeout'));
      }, timeoutMs);

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        clearTimeout(timeout);
        setListening(false);
        const transcript = event.results[0]?.[0]?.transcript ?? '';
        resolve(transcript.trim());
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        clearTimeout(timeout);
        setListening(false);
        reject(new Error(event.error));
      };

      recognition.onend = () => {
        clearTimeout(timeout);
        setListening(false);
      };

      try {
        recognition.start();
      } catch (e) {
        clearTimeout(timeout);
        setListening(false);
        reject(e);
      }
    });
  }, [setListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setListening(false);
  }, [setListening]);

  // Speak then listen
  const prompt = useCallback(async (text: string, timeoutMs = 8000): Promise<string | null> => {
    await speak(text);
    try {
      return await listen(timeoutMs);
    } catch {
      return null;
    }
  }, [speak, listen]);

  return { speak, listen, stopSpeaking, stopListening, prompt };
}
