import { useState } from 'react';
import { useStore } from '../store';
import { useAmira } from '../hooks/useAmira';
import { MicButton, AmiraReopenButton } from '../components/amira/MicButton';
import { AmiraBubble } from '../components/amira/AmiraBubble';
import { VoiceToggle } from '../components/ui/VoiceToggle';
import { LANG_OPTIONS, LANGS } from '../constants/langs';
import { detectIntent, isYes } from '../utils/intent';
import type { LangCode } from '../types';

export function Welcome() {
  const language       = useStore(s => s.language);
  const setLanguage    = useStore(s => s.setLanguage);
  const navigate       = useStore(s => s.navigate);
  const setAmiraText   = useStore(s => s.setAmiraText);
  const amiraDismissed = useStore(s => s.amiraDismissed);
  const dismissAmira   = useStore(s => s.dismissAmira);
  const restoreAmira   = useStore(s => s.restoreAmira);
  const voiceEnabled   = useStore(s => s.voiceEnabled);
  const { speak, converse, activateListen, stopSpeaking } = useAmira();

  const [phase, setPhase] = useState<'idle' | 'lang' | 'account'>('idle');

  const L = LANGS[language];

  // ── Mic button — starts the full voice conversation ──────────
  const handleMicClick = async () => {
    if (amiraDismissed) { restoreAmira(); return; }
    stopSpeaking();

    // Set Amira's greeting text immediately (visible even if voice is off)
    setAmiraText(`${L.welcome} ${L.welcome_sub}`);
    setPhase('lang');

    // If voice is enabled, run the full conversation loop
    if (voiceEnabled) {
      await speak(`${L.welcome} ${L.welcome_sub}`);
      const langResp = await converse(L.choose_lang, { listenMs: 12000 });

      if (langResp) {
        const lower = langResp.toLowerCase();
        if      (lower.includes('hausa')   || lower.includes('ha'))   setLanguage('ha');
        else if (lower.includes('yoruba')  || lower.includes('yor'))  setLanguage('yo');
        else if (lower.includes('igbo')    || lower.includes('ibo'))  setLanguage('ig');
        else if (lower.includes('english') || lower.includes('en'))   setLanguage('en');
      }

      setPhase('account');
      const L2 = LANGS[language];
      const accountResp = await converse(L2.have_account, { listenMs: 10000 });

      if (accountResp) {
        const intent = detectIntent(accountResp);
        if (intent === 'YES' || intent === 'LOGIN') { await speak(L2.yes + '!'); navigate('login'); }
        else { await speak(L2.no + '!'); navigate('register'); }
      }
    } else {
      // Voice off — just show the text and guide visually
      setPhase('account');
    }
  };

  // ── Language selection (manual) ──────────────────────────────
  const selectLanguage = async (lang: LangCode) => {
    setLanguage(lang);
    const LN = LANGS[lang];
    setAmiraText(LN.have_account);
    setPhase('account');
    if (voiceEnabled) {
      const resp = await converse(LN.have_account, { listenMs: 10000 });
      if (resp) {
        if (isYes(resp) || detectIntent(resp) === 'LOGIN') navigate('login');
        else navigate('register');
      }
    }
  };

  // ── Voice command while on account phase ─────────────────────
  const listenForAccount = async () => {
    const L2 = LANGS[language];
    setAmiraText(L2.have_account);
    const resp = await converse(L2.have_account, { listenMs: 10000 });
    if (resp) {
      if (isYes(resp) || detectIntent(resp) === 'LOGIN') navigate('login');
      else navigate('register');
    }
  };

  return (
    <div
      className="phone-frame"
      style={{ background: 'linear-gradient(160deg, #0D1B3E 0%, #1A3C8F 60%, #0D1B3E 100%)' }}
    >
      <div className="scroll-area flex flex-col items-center">

        {/* Logo */}
        <div className="flex flex-col items-center pt-14 pb-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
               style={{ background: 'rgba(0,194,124,0.12)', border: '1.5px solid rgba(0,194,124,0.35)' }}>
            <span className="text-2xl font-black text-brand-accent" style={{ fontFamily: 'DM Sans' }}>ii</span>
          </div>
          <span className="text-2xl font-black text-white tracking-tight">iinpaay</span>
          <span className="text-[10px] font-medium text-white/35 tracking-widest uppercase mt-0.5">Financial Trust</span>
        </div>

        {/* Amira bubble — shows Amira's text even when voice is off */}
        {phase !== 'idle' && (
          <div className="w-full max-w-sm px-4 mb-5 animate-fade-in">
            <AmiraBubble />
          </div>
        )}

        {/* Intro text when idle */}
        {phase === 'idle' && (
          <div className="w-full max-w-sm px-5 mb-6 text-center animate-fade-in">
            <p className="text-white/60 text-sm leading-relaxed">
              {L.welcome_sub}
            </p>
            <p className="text-white/35 text-xs mt-2">{L.tap_mic}</p>
          </div>
        )}

        {/* Mic button */}
        {amiraDismissed ? (
          <AmiraReopenButton onReopen={restoreAmira} />
        ) : (
          <MicButton
            onClick={phase === 'account' ? listenForAccount : handleMicClick}
            onDismiss={dismissAmira}
            size="md"
            label="Amira"
          />
        )}

        {/* Language grid — show after mic is first tapped */}
        {phase === 'lang' && (
          <div className="w-full px-5 mt-6 animate-slide-up">
            <p className="text-center text-white/45 text-[11px] font-semibold mb-3 uppercase tracking-widest">
              {L.choose_lang}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {LANG_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => selectLanguage(opt.code)}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border transition-all active:scale-95"
                  style={{
                    background:  language === opt.code ? 'rgba(0,194,124,0.15)' : 'rgba(255,255,255,0.06)',
                    borderColor: language === opt.code ? 'rgba(0,194,124,0.5)'  : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <span className="text-2xl">{opt.flag}</span>
                  <div className="text-left">
                    <div className="text-white text-sm font-semibold">{opt.label}</div>
                    <div className="text-white/35 text-[10px]">{opt.native}</div>
                  </div>
                  {language === opt.code && <span className="ml-auto text-brand-accent text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Account check buttons */}
        {phase === 'account' && (
          <div className="w-full px-5 mt-4 animate-slide-up">
            <p className="text-center text-white/45 text-[13px] mb-4">{L.have_account}</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('login')}
                      className="flex-1 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.2)' }}>
                {L.yes}
              </button>
              <button onClick={() => navigate('register')}
                      className="flex-1 py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E', boxShadow: '0 4px 18px rgba(0,194,124,0.4)' }}>
                {L.no}
              </button>
            </div>
          </div>
        )}

        {/* Manual CTAs always visible */}
        {phase === 'idle' && (
          <div className="w-full px-5 mt-6 flex flex-col gap-3 animate-slide-up">
            <button onClick={() => navigate('register')}
                    className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #00C27C, #00E89A)', color: '#0D1B3E', boxShadow: '0 4px 18px rgba(0,194,124,0.4)' }}>
              Create Account
            </button>
            <button onClick={() => navigate('login')}
                    className="w-full py-4 rounded-2xl font-bold text-[15px] transition-all active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.15)' }}>
              I Have an Account
            </button>
          </div>
        )}

        {/* Voice toggle */}
        <div className="w-full px-5 mt-6">
          <VoiceToggle compact />
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
