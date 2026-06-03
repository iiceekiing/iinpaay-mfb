import { useCallback, useRef } from 'react';
import { useStore } from '../store';
import { LANG_VOICE_CODE } from '../constants/langs';
import type { LangCode } from '../types';

// ── Web Speech API types ──────────────────────────────────────
interface ISpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface ISpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang:             string;
  continuous:       boolean;
  interimResults:   boolean;
  maxAlternatives:  number;
  onresult: ((ev: ISpeechRecognitionEvent)      => void) | null;
  onerror:  ((ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend:    (() => void) | null;
  start():  void;
  stop():   void;
  abort():  void;
}
interface ISpeechRecognitionCtor { new(): ISpeechRecognition; }

declare global {
  interface Window {
    SpeechRecognition:       ISpeechRecognitionCtor;
    webkitSpeechRecognition: ISpeechRecognitionCtor;
  }
}

export function isSpeechSupported(): boolean {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ── Female voice selection ────────────────────────────────────
// Names/patterns that reliably identify female voices across platforms
const FEMALE_NAME_PATTERNS: RegExp[] = [
  // Explicit female markers
  /female/i, /woman/i, /girl/i, /féminine/i,
  // Known female voice names (macOS / iOS)
  /samantha/i, /victoria/i, /karen/i, /moira/i, /tessa/i,
  /fiona/i, /veena/i, /ava/i, /allison/i, /susan/i, /kathy/i,
  // Windows Narrator / Edge female voices
  /zira/i, /hazel/i, /libby/i, /aria/i, /jenny/i, /ana/i, /emma/i,
  // Google TTS female
  /google.*female/i, /google.*uk.*english.*female/i,
  // African / common female names
  /ngozi/i, /amira/i, /aisha/i, /fatima/i, /grace/i, /joy/i,
];

// Voices that are explicitly NOT female (known male voice names)
const MALE_NAME_PATTERNS: RegExp[] = [
  /male/i, /man\b/i, /\bfred\b/i, /\balex\b/i, /\btom\b/i,
  /\bdaniel\b/i, /\blee\b/i, /\brishi\b/i, /\bmohan\b/i,
];

// Qualities to prefer among female voices
const PREMIUM_PATTERNS: RegExp[] = [
  /premium/i, /enhanced/i, /neural/i, /natural/i, /google/i, /siri/i,
];

function pickFemaleVoice(voices: SpeechSynthesisVoice[], langCode: string): SpeechSynthesisVoice | null {
  const langPrefix = langCode.split('-')[0] ?? 'en';

  function isFemale(v: SpeechSynthesisVoice): boolean {
    const name = v.name;
    if (MALE_NAME_PATTERNS.some(p => p.test(name))) return false;
    return FEMALE_NAME_PATTERNS.some(p => p.test(name));
  }
  function isPremium(v: SpeechSynthesisVoice): boolean {
    return PREMIUM_PATTERNS.some(p => p.test(v.name));
  }

  // Priority 1 — premium female in target language
  const langVoices = voices.filter(v => v.lang.startsWith(langPrefix));
  const femaleLang = langVoices.filter(isFemale);
  const premiumLang = femaleLang.find(isPremium);
  if (premiumLang) return premiumLang;
  if (femaleLang.length > 0) return femaleLang[0]!;

  // Priority 2 — any female in target language (not marked male)
  const notMaleLang = langVoices.filter(v => !MALE_NAME_PATTERNS.some(p => p.test(v.name)));
  if (notMaleLang.length > 0) return notMaleLang[0]!;

  // Priority 3 — premium female in English
  const enVoices  = voices.filter(v => v.lang.startsWith('en'));
  const femaleEn  = enVoices.filter(isFemale);
  const premiumEn = femaleEn.find(isPremium);
  if (premiumEn) return premiumEn;
  if (femaleEn.length > 0) return femaleEn[0]!;

  // Priority 4 — any English voice (likely better than nothing)
  if (enVoices.length > 0) return enVoices[0]!;

  // Last resort — whatever is available
  return voices[0] ?? null;
}

// ── Hook ──────────────────────────────────────────────────────
export function useAmira() {
  const language     = useStore(s => s.language);
  const voiceEnabled = useStore(s => s.voiceEnabled);
  const setAmiraText = useStore(s => s.setAmiraText);
  const setTranscript= useStore(s => s.setTranscript);
  const setSpeaking  = useStore(s => s.setSpeaking);
  const setListening = useStore(s => s.setListening);
  const setProcessing= useStore(s => s.setProcessing);

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const cancelSpeakRef = useRef(false);

  // ── Text-to-Speech ────────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      // Always update the visual bubble text regardless of voice setting
      setAmiraText(text);

      // If voice is OFF, just show the text — no audio
      if (!voiceEnabled || !('speechSynthesis' in window)) {
        setSpeaking(false);
        resolve();
        return;
      }

      cancelSpeakRef.current = false;
      window.speechSynthesis.cancel();
      setSpeaking(true);

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceCode = LANG_VOICE_CODE[language as LangCode] || 'en-NG';

      const trySpeak = () => {
        if (cancelSpeakRef.current) { setSpeaking(false); resolve(); return; }

        const voices = window.speechSynthesis.getVoices();
        const voice  = pickFemaleVoice(voices, voiceCode);

        if (voice) {
          utterance.voice = voice;
          // Use the voice's native language if it matches, else use voiceCode
          utterance.lang = voice.lang || voiceCode;
        } else {
          utterance.lang = voiceCode;
        }

        utterance.rate   = 0.88;
        utterance.pitch  = 1.08;   // slightly higher — softer feminine tone
        utterance.volume = 1;

        utterance.onend   = () => { setSpeaking(false); resolve(); };
        utterance.onerror = () => { setSpeaking(false); resolve(); };

        // Chrome bug: speechSynthesis sometimes stalls — nudge it
        window.speechSynthesis.speak(utterance);
        const nudge = setInterval(() => {
          if (!window.speechSynthesis.speaking) clearInterval(nudge);
          else window.speechSynthesis.resume();
        }, 5000);
        utterance.onend = () => { clearInterval(nudge); setSpeaking(false); resolve(); };
      };

      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = trySpeak;
      } else {
        trySpeak();
      }
    });
  }, [language, voiceEnabled, setAmiraText, setSpeaking]);

  const stopSpeaking = useCallback(() => {
    cancelSpeakRef.current = true;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [setSpeaking]);

  // ── Speech Recognition ────────────────────────────────────
  const listen = useCallback((timeoutMs = 10000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) {
        reject(new Error('speech-not-supported'));
        return;
      }

      // Abort any in-flight recognition cleanly
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }

      // Small delay so TTS echo doesn't bleed into the mic
      const startRec = () => {
        const rec: ISpeechRecognition = new SR();
        recognitionRef.current = rec;

        rec.lang            = 'en-NG';
        rec.continuous      = false;
        rec.interimResults  = false;
        rec.maxAlternatives = 5;

        let resultCaptured = false;
        setListening(true);
        setProcessing(false);

        const hardTimeout = setTimeout(() => {
          if (!resultCaptured) {
            try { rec.abort(); } catch { /* ignore */ }
            setListening(false);
            setProcessing(false);
            reject(new Error('timeout'));
          }
        }, timeoutMs);

        rec.onresult = (event: ISpeechRecognitionEvent) => {
          clearTimeout(hardTimeout);
          resultCaptured = true;
          setListening(false);

          const transcript = event.results[0]?.[0]?.transcript?.trim() ?? '';
          // Show "processing" briefly so user knows the speech was received
          setTranscript(transcript);
          setProcessing(true);
          setTimeout(() => setProcessing(false), 900);

          resolve(transcript);
        };

        rec.onerror = (event: ISpeechRecognitionErrorEvent) => {
          clearTimeout(hardTimeout);
          setListening(false);
          setProcessing(false);
          reject(new Error(event.error));
        };

        rec.onend = () => {
          clearTimeout(hardTimeout);
          if (!resultCaptured) {
            setListening(false);
            setProcessing(false);
            reject(new Error('ended-without-result'));
          }
        };

        try {
          rec.start();
        } catch (e) {
          clearTimeout(hardTimeout);
          setListening(false);
          setProcessing(false);
          reject(e);
        }
      };

      // 150ms gap after TTS ends before mic opens
      delay(150).then(startRec);
    });
  }, [setListening, setProcessing, setTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setListening(false);
    setProcessing(false);
  }, [setListening, setProcessing]);

  /**
   * converse — speak a prompt, then automatically start listening.
   * Only available when voiceEnabled is true; falls back to null immediately
   * if voice is OFF so callers can show manual input instead.
   */
  const converse = useCallback(async (
    text: string,
    opts?: { listenMs?: number; pauseMs?: number }
  ): Promise<string | null> => {
    await speak(text);
    if (!voiceEnabled) return null;  // voice off — don't try to listen

    await delay(opts?.pauseMs ?? 300);
    try {
      return await listen(opts?.listenMs ?? 10000);
    } catch {
      return null;
    }
  }, [speak, listen, voiceEnabled]);

  /**
   * prompt — speak then listen, identical to converse but clearer name
   * for single-shot prompts.
   */
  const prompt = useCallback(async (
    text: string,
    timeoutMs = 10000
  ): Promise<string | null> => {
    await speak(text);
    if (!voiceEnabled) return null;
    await delay(300);
    try { return await listen(timeoutMs); } catch { return null; }
  }, [speak, listen, voiceEnabled]);

  /**
   * activateListen — start listening immediately without speaking first.
   * Used by the "Ask Amira" button.
   */
  const activateListen = useCallback(async (timeoutMs = 10000): Promise<string | null> => {
    if (!voiceEnabled) return null;
    try { return await listen(timeoutMs); } catch { return null; }
  }, [listen, voiceEnabled]);

  return {
    speak,
    listen,
    converse,
    prompt,
    activateListen,
    stopSpeaking,
    stopListening,
    isSpeechSupported,
  };
}
