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
  lang:            string;
  continuous:      boolean;
  interimResults:  boolean;
  maxAlternatives: number;
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

// ── INPAAY brand pronunciation ────────────────────────────────
// Always pronounce as "inpay" (short for instalmental payment)
export function sanitizeForSpeech(text: string): string {
  return text
    .replace(/iinpaay/gi, 'inpay')
    .replace(/INPAAY/g,   'inpay');
}

// ── Female voice selection ────────────────────────────────────
const FEMALE_NAME_PATTERNS: RegExp[] = [
  /female/i, /woman/i, /girl/i, /féminine/i,
  // macOS / iOS
  /samantha/i, /victoria/i, /karen/i, /moira/i, /tessa/i,
  /fiona/i, /veena/i, /ava/i, /allison/i, /susan/i, /kathy/i,
  // Windows / Edge
  /zira/i, /hazel/i, /libby/i, /aria/i, /jenny/i, /ana/i, /emma/i,
  /sonia/i, /natasha/i, /catherine/i, /linda/i, /kate/i, /michelle/i,
  // Google TTS
  /google.*female/i, /google.*uk.*english.*female/i,
  // African / warm names
  /ngozi/i, /amira/i, /aisha/i, /fatima/i, /grace/i, /joy/i, /adaeze/i,
];

const MALE_NAME_PATTERNS: RegExp[] = [
  /\bmale\b/i, /\bman\b/i, /\bfred\b/i, /\balex\b/i, /\btom\b/i,
  /\bdaniel\b/i, /\blee\b/i, /\brishi\b/i, /\bmohan\b/i, /\bjames\b/i,
  /\bdavid\b/i, /\bmichael\b/i, /\brobert\b/i, /\bmark\b/i,
];

const PREMIUM_PATTERNS: RegExp[] = [
  /premium/i, /enhanced/i, /neural/i, /natural/i, /google/i,
  /wavenet/i, /studio/i, /journey/i,
];

function pickFemaleVoice(
  voices: SpeechSynthesisVoice[],
  langCode: string
): SpeechSynthesisVoice | null {
  const langPrefix = langCode.split('-')[0] ?? 'en';

  function isFemale(v: SpeechSynthesisVoice): boolean {
    if (MALE_NAME_PATTERNS.some(p => p.test(v.name))) return false;
    return FEMALE_NAME_PATTERNS.some(p => p.test(v.name));
  }
  function isPremium(v: SpeechSynthesisVoice): boolean {
    return PREMIUM_PATTERNS.some(p => p.test(v.name));
  }
  function notMale(v: SpeechSynthesisVoice): boolean {
    return !MALE_NAME_PATTERNS.some(p => p.test(v.name));
  }

  // 1. Premium female in target language
  const langVoices = voices.filter(v => v.lang.startsWith(langPrefix));
  const femaleLang = langVoices.filter(isFemale);
  const premLang   = femaleLang.find(isPremium);
  if (premLang) return premLang;
  if (femaleLang.length > 0) return femaleLang[0]!;

  // 2. Any non-male in target language
  const notMaleLang = langVoices.filter(notMale);
  if (notMaleLang.length > 0) return notMaleLang[0]!;

  // 3. Premium female in English
  const enVoices = voices.filter(v => v.lang.startsWith('en'));
  const femaleEn = enVoices.filter(isFemale);
  const premEn   = femaleEn.find(isPremium);
  if (premEn)  return premEn;
  if (femaleEn.length > 0) return femaleEn[0]!;

  // 4. Any non-male English voice
  const notMaleEn = enVoices.filter(notMale);
  if (notMaleEn.length > 0) return notMaleEn[0]!;

  // 5. Anything
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
      // Always update the visual bubble text
      setAmiraText(text);

      if (!voiceEnabled || !('speechSynthesis' in window)) {
        setSpeaking(false);
        resolve();
        return;
      }

      cancelSpeakRef.current = false;
      window.speechSynthesis.cancel();
      setSpeaking(true);

      // Sanitize brand name pronunciation
      const spokenText = sanitizeForSpeech(text);
      const utterance  = new SpeechSynthesisUtterance(spokenText);
      const voiceCode  = LANG_VOICE_CODE[language as LangCode] || 'en-NG';

      const trySpeak = () => {
        if (cancelSpeakRef.current) { setSpeaking(false); resolve(); return; }

        const voices = window.speechSynthesis.getVoices();
        const voice  = pickFemaleVoice(voices, voiceCode);

        if (voice) {
          utterance.voice = voice;
          utterance.lang  = voice.lang || voiceCode;
        } else {
          utterance.lang = voiceCode;
        }

        utterance.rate   = 0.9;    // slightly slower — clearer
        utterance.pitch  = 1.05;   // gently feminine
        utterance.volume = 1;

        const nudge = setInterval(() => {
          if (!window.speechSynthesis.speaking) clearInterval(nudge);
          else window.speechSynthesis.resume();
        }, 5000);

        utterance.onend   = () => { clearInterval(nudge); setSpeaking(false); resolve(); };
        utterance.onerror = () => { clearInterval(nudge); setSpeaking(false); resolve(); };

        window.speechSynthesis.speak(utterance);
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
  const listen = useCallback((timeoutMs = 15000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { reject(new Error('speech-not-supported')); return; }

      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }

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

      // 200ms gap after TTS ends before mic opens
      delay(200).then(startRec);
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
   * converse — speak a prompt then listen.
   * Retries up to `maxRetries` times if no speech is detected.
   * Returns null if all retries fail or voice is off.
   */
  const converse = useCallback(async (
    text: string,
    opts?: { listenMs?: number; pauseMs?: number; maxRetries?: number; retryPrompt?: string }
  ): Promise<string | null> => {
    await speak(text);
    if (!voiceEnabled) return null;

    const maxRetries = opts?.maxRetries ?? 2;
    const listenMs   = opts?.listenMs   ?? 15000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await delay(opts?.pauseMs ?? 300);
      try {
        const result = await listen(listenMs);
        if (result && result.trim().length > 0) return result;
      } catch {
        // timeout or error — retry
      }

      if (attempt < maxRetries) {
        const retryMsg = opts?.retryPrompt ?? `I didn't hear a response. ${text}`;
        await speak(retryMsg);
      }
    }

    return null;
  }, [speak, listen, voiceEnabled]);

  /**
   * prompt — identical to converse, clearer name for single-shot prompts.
   */
  const prompt = useCallback(async (
    text: string,
    timeoutMs = 15000
  ): Promise<string | null> => {
    return converse(text, { listenMs: timeoutMs });
  }, [converse]);

  /**
   * activateListen — start listening without speaking first.
   */
  const activateListen = useCallback(async (timeoutMs = 15000): Promise<string | null> => {
    if (!voiceEnabled) return null;
    await delay(200);
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
