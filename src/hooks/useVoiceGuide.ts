import { useCallback, useRef } from 'react';
import { useStore } from '../store';
import { LANG_VOICE_CODE } from '../constants/langs';
import { sanitizeForSpeech } from './useAmira';
import type { LangCode } from '../types';

// ── Female voice selection (shared logic with useAmira) ───────
const FEMALE_PATTERNS = [
  /female/i, /woman/i, /samantha/i, /victoria/i, /karen/i, /tessa/i,
  /zira/i, /hazel/i, /libby/i, /aria/i, /jenny/i, /ana/i, /emma/i,
  /sonia/i, /ngozi/i, /amira/i, /aisha/i, /grace/i, /joy/i,
];
const MALE_PATTERNS = [
  /\bmale\b/i, /\bman\b/i, /\bfred\b/i, /\balex\b/i, /\btom\b/i,
  /\bdaniel\b/i, /\blee\b/i, /\brishi\b/i, /\bmohan\b/i,
];
const PREMIUM_PATTERNS = [
  /premium/i, /enhanced/i, /neural/i, /natural/i, /google/i, /wavenet/i,
];

function pickVoice(voices: SpeechSynthesisVoice[], langCode: string) {
  const pfx = langCode.split('-')[0] ?? 'en';
  const isFemale = (v: SpeechSynthesisVoice) =>
    !MALE_PATTERNS.some(p => p.test(v.name)) && FEMALE_PATTERNS.some(p => p.test(v.name));
  const isPremium = (v: SpeechSynthesisVoice) =>
    PREMIUM_PATTERNS.some(p => p.test(v.name));
  const langV = voices.filter(v => v.lang.startsWith(pfx));
  const femLang = langV.filter(isFemale);
  const prem = femLang.find(isPremium);
  if (prem) return prem;
  if (femLang.length) return femLang[0]!;
  const enV = voices.filter(v => v.lang.startsWith('en'));
  const femEn = enV.filter(isFemale);
  if (femEn.length) return femEn[0]!;
  return voices[0] ?? null;
}

/**
 * useVoiceGuide — persistent background accessibility narration.
 *
 * Separate from Amira: VoiceGuide narrates the screen/fields.
 * Amira handles interactive Q&A. VoiceGuide yields to Amira automatically
 * because speechSynthesis.cancel() in speak() will cut VoiceGuide off,
 * and Amira always takes priority.
 */
export function useVoiceGuide() {
  const voiceGuideEnabled = useStore(s => s.voiceGuideEnabled);
  const isListening       = useStore(s => s.isListening);
  const isSpeaking        = useStore(s => s.isSpeaking);
  const language          = useStore(s => s.language);

  const queueRef = useRef<string[]>([]);
  const playingRef = useRef(false);

  const playNext = useCallback(() => {
    if (playingRef.current) return;
    if (!voiceGuideEnabled || !('speechSynthesis' in window)) return;
    const text = queueRef.current.shift();
    if (!text) return;

    playingRef.current = true;
    const utter = new SpeechSynthesisUtterance(sanitizeForSpeech(text));
    const voiceCode = LANG_VOICE_CODE[language as LangCode] || 'en-NG';

    const doSpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const voice  = pickVoice(voices, voiceCode);
      if (voice) { utter.voice = voice; utter.lang = voice.lang || voiceCode; }
      else utter.lang = voiceCode;

      utter.rate   = 0.88;
      utter.pitch  = 1.0;
      utter.volume = 0.9;  // slightly quieter than Amira

      utter.onend   = () => { playingRef.current = false; playNext(); };
      utter.onerror = () => { playingRef.current = false; playNext(); };

      window.speechSynthesis.speak(utter);
    };

    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = doSpeak;
    } else {
      doSpeak();
    }
  }, [voiceGuideEnabled, language]);

  /**
   * announce — speak a narration string via VoiceGuide.
   * Silently ignored when VoiceGuide is off, Amira is listening, or Amira is speaking.
   */
  const announce = useCallback((text: string) => {
    if (!voiceGuideEnabled || !('speechSynthesis' in window)) return;
    if (isListening || isSpeaking) return;   // Amira has priority
    queueRef.current.push(text);
    if (!playingRef.current) playNext();
  }, [voiceGuideEnabled, isListening, isSpeaking, playNext]);

  /**
   * announceField — announce a field label then its prompt.
   * Call from onFocus handlers.
   *
   * Example: announceField('Full Name', 'Please enter your full name.')
   * Speaks:  "Full Name. Please enter your full name."
   */
  const announceField = useCallback((label: string, prompt: string) => {
    announce(`${label}. ${prompt}`);
  }, [announce]);

  /**
   * announcePage — call once when navigating to a new page.
   */
  const announcePage = useCallback((pageDescription: string) => {
    // Clear queue and speak page description immediately
    queueRef.current = [pageDescription];
    playingRef.current = false;
    playNext();
  }, [playNext]);

  return { announce, announceField, announcePage };
}
