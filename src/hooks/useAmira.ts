import { useCallback, useRef } from 'react';
import { useStore } from '../store';
import { LANG_VOICE_CODE } from '../constants/langs';
import type { LangCode } from '../types';

// ── Web Speech API types ──────────────────────────────────────
interface ISpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface ISpeechRecognitionErrorEvent extends Event { error: string; }
interface ISpeechRecognition extends EventTarget {
  lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
  onresult: ((ev: ISpeechRecognitionEvent) => void) | null;
  onerror:  ((ev: ISpeechRecognitionErrorEvent) => void) | null;
  onend:    (() => void) | null;
  onspeechstart: (() => void) | null;
  onspeechend:   (() => void) | null;
  start(): void; stop(): void; abort(): void;
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
export function sanitizeForSpeech(text: string): string {
  return text
    .replace(/iinpaay/gi, 'inpay')
    .replace(/INPAAY/g,   'inpay');
}

// ── Microphone permission helpers ─────────────────────────────
export async function checkMicPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  try {
    if (!navigator.permissions) return 'prompt';
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state as 'granted' | 'denied' | 'prompt';
  } catch {
    return 'prompt';
  }
}

export async function requestMicAccess(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch {
    return false;
  }
}

// ── Female voice selection ────────────────────────────────────
const FEMALE_PATTERNS: RegExp[] = [
  /female/i, /woman/i, /girl/i,
  /samantha/i, /victoria/i, /karen/i, /moira/i, /tessa/i, /fiona/i,
  /veena/i, /ava/i, /allison/i, /susan/i, /kathy/i,
  /zira/i, /hazel/i, /libby/i, /aria/i, /jenny/i, /ana/i, /emma/i,
  /sonia/i, /natasha/i, /catherine/i, /linda/i, /kate/i, /michelle/i,
  /google.*female/i,
  /ngozi/i, /amira/i, /aisha/i, /fatima/i, /grace/i, /joy/i,
];
const MALE_PATTERNS: RegExp[] = [
  /\bmale\b/i, /\bman\b/i, /\bfred\b/i, /\balex\b/i, /\btom\b/i,
  /\bdaniel\b/i, /\blee\b/i, /\brishi\b/i, /\bmohan\b/i,
  /\bjames\b/i, /\bdavid\b/i, /\bmichael\b/i,
];
const PREMIUM_PATTERNS: RegExp[] = [
  /premium/i, /enhanced/i, /neural/i, /natural/i, /google/i, /wavenet/i, /studio/i,
];

function pickFemaleVoice(voices: SpeechSynthesisVoice[], langCode: string) {
  const pfx = langCode.split('-')[0] ?? 'en';
  const isFemale  = (v: SpeechSynthesisVoice) => !MALE_PATTERNS.some(p => p.test(v.name)) && FEMALE_PATTERNS.some(p => p.test(v.name));
  const isPremium = (v: SpeechSynthesisVoice) => PREMIUM_PATTERNS.some(p => p.test(v.name));
  const notMale   = (v: SpeechSynthesisVoice) => !MALE_PATTERNS.some(p => p.test(v.name));

  const langV  = voices.filter(v => v.lang.startsWith(pfx));
  const femL   = langV.filter(isFemale);
  const premL  = femL.find(isPremium);
  if (premL)           return premL;
  if (femL.length)     return femL[0]!;
  const notMaleL = langV.filter(notMale);
  if (notMaleL.length) return notMaleL[0]!;

  const enV    = voices.filter(v => v.lang.startsWith('en'));
  const femE   = enV.filter(isFemale);
  const premE  = femE.find(isPremium);
  if (premE)           return premE;
  if (femE.length)     return femE[0]!;
  const notMaleE = enV.filter(notMale);
  if (notMaleE.length) return notMaleE[0]!;

  return voices[0] ?? null;
}

// ── Hook ──────────────────────────────────────────────────────
export function useAmira() {
  const language        = useStore(s => s.language);
  const voiceEnabled    = useStore(s => s.voiceEnabled);
  const setAmiraText    = useStore(s => s.setAmiraText);
  const setTranscript   = useStore(s => s.setTranscript);
  const setSpeaking     = useStore(s => s.setSpeaking);
  const setListening    = useStore(s => s.setListening);
  const setProcessing   = useStore(s => s.setProcessing);
  const setMicPermission= useStore(s => s.setMicPermission);

  const recognitionRef  = useRef<ISpeechRecognition | null>(null);
  const cancelSpeakRef  = useRef(false);
  const stopListenRef   = useRef(false);   // signal to abort listening loop

  // ── Text-to-Speech ────────────────────────────────────────
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise(resolve => {
      setAmiraText(text);
      if (!voiceEnabled || !('speechSynthesis' in window)) { setSpeaking(false); resolve(); return; }

      cancelSpeakRef.current = false;
      window.speechSynthesis.cancel();
      setSpeaking(true);

      const spokenText = sanitizeForSpeech(text);
      const utterance  = new SpeechSynthesisUtterance(spokenText);
      const voiceCode  = LANG_VOICE_CODE[language as LangCode] || 'en-NG';

      const trySpeak = () => {
        if (cancelSpeakRef.current) { setSpeaking(false); resolve(); return; }
        const voices = window.speechSynthesis.getVoices();
        const voice  = pickFemaleVoice(voices, voiceCode);
        if (voice) { utterance.voice = voice; utterance.lang = voice.lang || voiceCode; }
        else utterance.lang = voiceCode;

        utterance.rate = 0.9; utterance.pitch = 1.05; utterance.volume = 1;

        const nudge = setInterval(() => {
          if (!window.speechSynthesis.speaking) clearInterval(nudge);
          else window.speechSynthesis.resume();
        }, 5000);
        utterance.onend   = () => { clearInterval(nudge); setSpeaking(false); resolve(); };
        utterance.onerror = () => { clearInterval(nudge); setSpeaking(false); resolve(); };
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0)
        window.speechSynthesis.onvoiceschanged = trySpeak;
      else trySpeak();
    });
  }, [language, voiceEnabled, setAmiraText, setSpeaking]);

  const stopSpeaking = useCallback(() => {
    cancelSpeakRef.current = true;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, [setSpeaking]);

  // ── Speech Recognition (continuous, patient) ──────────────
  /**
   * listen — opens mic and waits for speech.
   *
   * Improvements over the old version:
   * • Checks + requests mic permission first
   * • Uses continuous=true so Chrome doesn't auto-stop
   * • Tracks interim results to detect speech activity
   * • Auto-restarts on no-speech error (browser timeout)
   * • Hard timeout: up to 30s; soft timeout resets on each spoken word
   */
  const listen = useCallback((timeoutMs = 25000): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { reject(new Error('speech-not-supported')); return; }

      // ── Check / request permission ─────────────────────────
      const perm = await checkMicPermission();
      if (perm === 'denied') {
        setMicPermission('denied');
        reject(new Error('mic-denied'));
        return;
      }
      if (perm === 'prompt') {
        const granted = await requestMicAccess();
        if (!granted) {
          setMicPermission('denied');
          reject(new Error('mic-denied'));
          return;
        }
      }
      setMicPermission('granted');

      // Abort any in-flight recognition
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
        recognitionRef.current = null;
      }

      stopListenRef.current = false;
      let resultCaptured = false;
      let speechActivityDetected = false;
      let softTimer: ReturnType<typeof setTimeout> | null = null;

      setListening(true);
      setProcessing(false);

      // Hard timeout — give up after timeoutMs
      const hardTimer = setTimeout(() => {
        if (!resultCaptured) {
          stopListenRef.current = true;
          try { recognitionRef.current?.abort(); } catch { /* ignore */ }
          recognitionRef.current = null;
          setListening(false); setProcessing(false);
          reject(new Error('timeout'));
        }
      }, timeoutMs);

      const clearAllTimers = () => {
        clearTimeout(hardTimer);
        if (softTimer) clearTimeout(softTimer);
      };

      // Soft timeout — 6s after last detected speech activity
      const resetSoftTimer = () => {
        if (softTimer) clearTimeout(softTimer);
        softTimer = setTimeout(() => {
          if (!resultCaptured && speechActivityDetected) {
            // Speech started but hasn't ended cleanly — stop and take what we have
            try { recognitionRef.current?.stop(); } catch { /* ignore */ }
          }
        }, 6000);
      };

      const startRec = () => {
        if (stopListenRef.current || resultCaptured) return;

        const rec: ISpeechRecognition = new SR();
        recognitionRef.current = rec;
        rec.lang           = 'en-NG';
        rec.continuous     = true;     // keep mic open
        rec.interimResults = true;     // detect speech activity via interim
        rec.maxAlternatives = 5;

        rec.onspeechstart = () => {
          speechActivityDetected = true;
          resetSoftTimer();
        };

        rec.onresult = (event: ISpeechRecognitionEvent) => {
          // Collect all final results
          let finalText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            if (result?.isFinal) {
              finalText += (result[0]?.transcript ?? '') + ' ';
            } else {
              // Interim — speech activity detected, reset soft timer
              speechActivityDetected = true;
              resetSoftTimer();
            }
          }

          if (finalText.trim()) {
            clearAllTimers();
            resultCaptured = true;
            stopListenRef.current = true;
            try { rec.stop(); } catch { /* ignore */ }
            setListening(false);

            const transcript = finalText.trim();
            setTranscript(transcript);
            setProcessing(true);
            setTimeout(() => setProcessing(false), 900);
            resolve(transcript);
          }
        };

        rec.onerror = (event: ISpeechRecognitionErrorEvent) => {
          if (resultCaptured || stopListenRef.current) return;

          if (event.error === 'no-speech') {
            // Chrome fires this after ~5-7s of silence — just restart
            try { rec.abort(); } catch { /* ignore */ }
            if (!stopListenRef.current) setTimeout(startRec, 150);
            return;
          }
          if (event.error === 'aborted') return; // intentional

          clearAllTimers();
          setListening(false); setProcessing(false);
          reject(new Error(event.error));
        };

        rec.onend = () => {
          if (resultCaptured || stopListenRef.current) return;
          // Ended without result (e.g. browser stopped) — restart
          setTimeout(startRec, 150);
        };

        try {
          rec.start();
        } catch (e) {
          clearAllTimers();
          setListening(false); setProcessing(false);
          reject(e);
        }
      };

      // Small gap after TTS ends before mic opens
      await delay(250);
      startRec();
    });
  }, [language, setListening, setProcessing, setTranscript, setMicPermission]);

  const stopListening = useCallback(() => {
    stopListenRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setListening(false);
    setProcessing(false);
  }, [setListening, setProcessing]);

  // ── converse — speak then listen, with patient retry ─────
  /**
   * Speaks the prompt, then listens.
   * On silence/timeout, retries up to `maxRetries` times with
   * escalating patience messages, exactly as requested.
   */
  const converse = useCallback(async (
    text: string,
    opts?: {
      listenMs?:   number;
      pauseMs?:    number;
      maxRetries?: number;
      retryPrompt?: string;
    }
  ): Promise<string | null> => {
    await speak(text);
    if (!voiceEnabled) return null;

    const maxRetries  = opts?.maxRetries ?? 2;
    const listenMs    = opts?.listenMs   ?? 25000;

    const RETRY_MSGS = [
      "I didn't hear anything. Please try again.",
      "I still didn't hear a response. Please speak clearly when you're ready.",
      "It's okay. Whenever you're ready, I'll be here to help.",
    ];

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      await delay(opts?.pauseMs ?? 300);
      try {
        const result = await listen(listenMs);
        if (result && result.trim().length > 0) return result;
      } catch (e) {
        const err = e instanceof Error ? e.message : '';
        if (err === 'mic-denied') return null;   // no point retrying
        // timeout / no-speech → retry
      }

      if (attempt < maxRetries) {
        const retryMsg = opts?.retryPrompt ?? RETRY_MSGS[attempt] ?? RETRY_MSGS[0]!;
        await speak(retryMsg);
      } else {
        // Final attempt exhausted — graceful exit
        await speak(RETRY_MSGS[2]!);
        stopListening();
      }
    }
    return null;
  }, [speak, listen, voiceEnabled, stopListening]);

  const prompt = useCallback(async (text: string, timeoutMs = 25000): Promise<string | null> => {
    return converse(text, { listenMs: timeoutMs });
  }, [converse]);

  const activateListen = useCallback(async (timeoutMs = 25000): Promise<string | null> => {
    if (!voiceEnabled) return null;
    await delay(250);
    try { return await listen(timeoutMs); } catch { return null; }
  }, [listen, voiceEnabled]);

  return {
    speak, listen, converse, prompt, activateListen,
    stopSpeaking, stopListening, isSpeechSupported,
    checkMicPermission, requestMicAccess,
  };
}
